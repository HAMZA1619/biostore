import { parseDesignSettings } from "@/lib/utils"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { CollectionTabs } from "@/components/store/collection-tabs"
import { SearchInput } from "@/components/store/search-input"
import { ViewTracker } from "@/components/store/view-tracker"
import { ProductGrid } from "@/components/store/product-grid"
import { getStoreBySlug, getStoreCollections, getStoreProducts, getStoreMarkets, getMarketPrices, getMarketExclusions, resolveImageUrls } from "@/lib/storefront/cache"
import { resolvePrice } from "@/lib/market/resolve-price"
import type { MarketInfo } from "@/lib/market/resolve-price"
import { getExchangeRate } from "@/lib/market/exchange-rates"

const PAGE_SIZE = 12

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ collection?: string; search?: string }>
}) {
  const { slug } = await params
  const { collection, search } = await searchParams

  const store = await getStoreBySlug(slug, "id, currency, description, design_settings")

  if (!store) notFound()

  const collections = await getStoreCollections(store.id)

  let activeCollectionId: string | null = null
  if (collection) {
    const activeCollection = collections?.find((c) => c.slug === collection)
    if (activeCollection) activeCollectionId = activeCollection.id
  }

  // Market resolution (before product fetch so we can apply exclusions)
  const cookieStore = await cookies()
  const marketSlug = cookieStore.get("biostore-market")?.value
  const markets = await getStoreMarkets(store.id)
  let activeMarket: MarketInfo | null = null
  if (markets && markets.length > 0) {
    const found = marketSlug
      ? markets.find((m) => m.slug === marketSlug)
      : markets.find((m) => m.is_default)
    if (found) {
      const rate = found.pricing_mode === "auto"
        ? await getExchangeRate(store.currency, found.currency)
        : 1
      activeMarket = {
        id: found.id,
        currency: found.currency,
        pricing_mode: found.pricing_mode as "fixed" | "auto",
        exchange_rate: rate,
        price_adjustment: Number(found.price_adjustment),
      }
    }
  }

  const excludedProductIds = activeMarket ? await getMarketExclusions(activeMarket.id) : []
  const rawProducts = await getStoreProducts(store.id, 0, PAGE_SIZE, activeCollectionId, search, excludedProductIds.length > 0 ? excludedProductIds : null)

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
          price: Math.round(v.price * activeMarket.exchange_rate * (1 + activeMarket.price_adjustment / 100) * 100) / 100,
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

  return (
    <div className="space-y-6">
      <ViewTracker storeId={store.id} />
      {store.description && (
        <p className="text-muted-foreground">{store.description}</p>
      )}

      {parseDesignSettings((store.design_settings || {}) as Record<string, unknown>).showSearch && <SearchInput storeSlug={slug} />}

      {!search && <CollectionTabs storeSlug={slug} collections={collections || []} />}

      <ProductGrid
        initialProducts={products || []}
        storeId={store.id}
        storeSlug={slug}
        collectionId={activeCollectionId}
        search={search || null}
        hasMore={(products?.length || 0) === PAGE_SIZE}
        marketId={activeMarket?.id}
      />
    </div>
  )
}
