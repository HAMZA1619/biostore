import { parseDesignSettings, getStoreUrl, getImageUrl } from "@/lib/utils"
import { getT } from "@/lib/i18n/storefront"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { CollectionTabs } from "@/components/store/collection-tabs"
import { SearchInput } from "@/components/store/search-input"
import { ViewTracker } from "@/components/store/view-tracker"
import { ProductGrid } from "@/components/store/product-grid"
import { getStoreBySlug, getStoreCollections, getStoreProducts, getStoreMarkets, getMarketPrices, getMarketExclusions, resolveImageUrls } from "@/lib/storefront/cache"
import { resolvePrice, applyRounding } from "@/lib/market/resolve-price"
import type { MarketInfo } from "@/lib/market/resolve-price"
import { getMarketExchangeRate } from "@/lib/market/exchange-rates"

const PAGE_SIZE = 12

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ search?: string; collection?: string }>
}) {
  const { slug } = await params
  const { search, collection } = await searchParams

  // 301 redirect old ?collection= URLs to new /collections/ pages
  if (collection) {
    redirect(`/${slug}/collections/${collection}`)
  }

  const store = await getStoreBySlug(slug, "id, name, language, currency, description, design_settings")

  if (!store) notFound()

  const collections = await getStoreCollections(store.id)

  // Market resolution (before product fetch so we can apply exclusions)
  const cookieStore = await cookies()
  const marketSlug = cookieStore.get("leadivo-market")?.value
  const markets = await getStoreMarkets(store.id)
  let activeMarket: MarketInfo | null = null
  if (markets && markets.length > 0) {
    const found = marketSlug
      ? markets.find((m) => m.slug === marketSlug)
      : markets.find((m) => m.is_default)
    if (found) {
      const rate = await getMarketExchangeRate(found, store.currency)
      activeMarket = {
        id: found.id,
        currency: found.currency,
        pricing_mode: found.pricing_mode as "fixed" | "auto",
        exchange_rate: rate,
        price_adjustment: Number(found.price_adjustment),
        rounding_rule: (found.rounding_rule || "none") as MarketInfo["rounding_rule"],
      }
    }
  }

  const excludedProductIds = activeMarket ? await getMarketExclusions(activeMarket.id) : []
  const rawProducts = await getStoreProducts(store.id, 0, PAGE_SIZE, null, search, excludedProductIds.length > 0 ? excludedProductIds : null)

  let marketPricesMap = new Map<string, { price: number; compare_at_price: number | null }>()
  if (activeMarket?.pricing_mode === "fixed" && rawProducts && rawProducts.length > 0) {
    const productIds = rawProducts.map((p) => p.id)
    const mp = await getMarketPrices(activeMarket.id, productIds)
    for (const row of mp || []) {
      if (!row.variant_id) {
        marketPricesMap.set(row.product_id, { price: Number(row.price), compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null })
      }
    }
  }

  // Resolve image IDs to URLs
  const allImageIds = (rawProducts || []).flatMap((p) => p.image_urls || [])
  const imageMap = await resolveImageUrls(allImageIds)
  const products = (rawProducts || []).map((p) => {
    const resolved = resolvePrice(
      Number(p.price),
      p.compare_at_price ? Number(p.compare_at_price) : null,
      store.currency,
      activeMarket,
      marketPricesMap.get(p.id) || null,
    )
    // Apply market auto-adjustment to variant display prices ("From X")
    const adjustedVariants = activeMarket?.pricing_mode === "auto" && p.product_variants?.length
      ? p.product_variants.map((v: { price: number }) => ({
          price: applyRounding(Math.round(v.price * activeMarket.exchange_rate * (1 + activeMarket.price_adjustment / 100) * 100) / 100, activeMarket.rounding_rule),
        }))
      : p.product_variants
    return {
      ...p,
      price: resolved.price,
      compare_at_price: resolved.compare_at_price,
      product_variants: adjustedVariants,
      image_urls: (p.image_urls || []).map((id: string) => imageMap.get(id)).filter(Boolean) as string[],
    }
  })

  const ds = parseDesignSettings((store.design_settings || {}) as Record<string, unknown>)
  const t = getT(store.language || "en")
  const storeName = ds.seoTitle || store.name
  const storeUrl = getStoreUrl(slug)
  const logoUrl = ds.logoPath ? getImageUrl(ds.logoPath) : null

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: storeUrl,
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(store.description ? { description: store.description } : {}),
  }

  const searchJsonLd = ds.showSearch ? {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: storeUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${storeUrl}?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  } : null

  const itemListJsonLd = products.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: storeName,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${storeUrl}/products/${p.slug || p.id}`,
      name: p.name,
    })),
  } : null

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {searchJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }}
        />
      )}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <ViewTracker storeId={store.id} marketId={activeMarket?.id} />
      <div>
        <h1 className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--store-heading-font)" }}>{storeName}</h1>
        {store.description && (
          <p className="mt-1 text-muted-foreground">{store.description}</p>
        )}
      </div>

      {parseDesignSettings((store.design_settings || {}) as Record<string, unknown>).showSearch && <SearchInput storeSlug={slug} />}

      {!search && collections && collections.length > 0 && (
        <section>
          <h2 className="sr-only">{t("storefront.collections")}</h2>
          <CollectionTabs storeSlug={slug} collections={collections} />
        </section>
      )}

      <ProductGrid
        initialProducts={products || []}
        storeId={store.id}
        storeSlug={slug}
        search={search || null}
        hasMore={(products?.length || 0) === PAGE_SIZE}
        marketId={activeMarket?.id}
      />
    </div>
  )
}
