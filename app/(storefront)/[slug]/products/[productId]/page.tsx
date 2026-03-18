import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { formatPriceSymbol, getStoreUrl } from "@/lib/utils"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { ProductImageGallery } from "@/components/store/product-image-gallery"
import { VariantSelector } from "@/components/store/variant-selector"
import { PixelViewContent } from "@/components/store/pixel-view-content"
import { TiktokPixelViewContent } from "@/components/store/tiktok-pixel-view-content"
import { getT } from "@/lib/i18n/storefront"
import { parseDesignSettings } from "@/lib/utils"
import { FaqAccordion } from "@/components/store/faq-accordion"
import { getStoreBySlug, getProduct, getProductVariants, getStoreMarkets, getMarketPrices, getMarketExclusions, resolveImageUrls } from "@/lib/storefront/cache"
import { resolvePrice } from "@/lib/market/resolve-price"
import type { MarketInfo } from "@/lib/market/resolve-price"
import { getMarketExchangeRate } from "@/lib/market/exchange-rates"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}): Promise<Metadata> {
  const { slug, productId } = await params
  const store = await getStoreBySlug(slug, "id, name, currency")
  if (!store) return {}

  const product = await getProduct(productId, store.id)
  if (!product) return {}

  const imageIds: string[] = product.image_urls || []
  let ogImage: string | undefined
  if (imageIds.length > 0) {
    const imgMap = await resolveImageUrls(imageIds.slice(0, 1))
    ogImage = imgMap.get(imageIds[0]) || undefined
  }

  const title = `${product.name} — ${store.name}`
  const description = product.description
    ? product.description.slice(0, 160)
    : `${product.name} — ${formatPriceSymbol(Number(product.price), store.currency)}`

  const canonical = `${getStoreUrl(slug)}/products/${product.slug || product.id}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      ...(ogImage ? { images: [{ url: ogImage, alt: title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": store.currency,
      "product:availability": product.is_available && (product.stock === null || product.stock === undefined || product.stock > 0) ? "instock" : "oos",
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const { slug, productId } = await params

  const store = await getStoreBySlug(slug, "id, name, language, currency, design_settings")

  if (!store) notFound()

  const ds = parseDesignSettings((store.design_settings || {}) as Record<string, unknown>)

  const product = await getProduct(productId, store.id)

  if (!product) notFound()

  // Market price resolution
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

  // Check if product is excluded from this market
  if (activeMarket) {
    const exclusions = await getMarketExclusions(activeMarket.id)
    if (exclusions.includes(productId)) notFound()
  }

  let marketPricesMap = new Map<string, { price: number; compare_at_price: number | null }>()
  if (activeMarket?.pricing_mode === "fixed") {
    const mp = await getMarketPrices(activeMarket.id, [productId])
    for (const row of mp || []) {
      const key = row.variant_id ? `${row.product_id}:${row.variant_id}` : row.product_id
      marketPricesMap.set(key, { price: Number(row.price), compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null })
    }
  }

  const displayCurrency = activeMarket?.currency || store.currency

  // Resolve base product price
  const resolvedProduct = resolvePrice(
    Number(product.price),
    product.compare_at_price ? Number(product.compare_at_price) : null,
    store.currency,
    activeMarket,
    marketPricesMap.get(productId) || null,
  )

  // Resolve image IDs to URLs
  const imageIds: string[] = product.image_urls || []
  let resolvedImageUrls: string[] = []
  if (imageIds.length > 0) {
    const imgMap = await resolveImageUrls(imageIds)
    resolvedImageUrls = imageIds.map((id) => imgMap.get(id)).filter(Boolean) as string[]
  }

  const hasOptions = product.options && (product.options as unknown[]).length > 0

  let variants: { id: string; options: Record<string, string>; price: number; compare_at_price: number | null; sku: string | null; stock: number | null; is_available: boolean }[] = []
  if (hasOptions) {
    const data = await getProductVariants(productId)

    variants = (data || []).map((v) => {
      const variantResolved = resolvePrice(
        Number(v.price),
        v.compare_at_price ? Number(v.compare_at_price) : null,
        store.currency,
        activeMarket,
        marketPricesMap.get(`${productId}:${v.id}`) || null,
      )
      return {
        id: v.id,
        options: v.options as Record<string, string>,
        price: variantResolved.price,
        compare_at_price: variantResolved.compare_at_price,
        sku: v.sku,
        stock: v.stock,
        is_available: v.is_available,
      }
    })
  }

  const productInStock = product.is_available && (product.stock === null || product.stock === undefined || product.stock > 0)
  const t = getT(store.language || "en")

  const storeUrl = getStoreUrl(slug)
  const productUrl = `${storeUrl}/products/${product.slug || product.id}`
  const collectionData = (product as Record<string, unknown>).collections as { name: string; slug?: string } | null
  const collectionName = collectionData?.name || null
  const collectionSlug = collectionData?.slug || null
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const variantInStock = (v: { is_available: boolean; stock: number | null }) =>
    v.is_available && (v.stock === null || v.stock > 0)

  const offersSchema = hasOptions && variants.length > 0
    ? {
        "@type": "AggregateOffer",
        url: productUrl,
        lowPrice: Math.min(...variants.map((v) => v.price)),
        highPrice: Math.max(...variants.map((v) => v.price)),
        priceCurrency: displayCurrency,
        offerCount: variants.length,
        availability: variants.some(variantInStock)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        offers: variants.map((v) => ({
          "@type": "Offer",
          url: productUrl,
          price: v.price,
          priceCurrency: displayCurrency,
          priceValidUntil,
          availability: variantInStock(v)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          ...(v.sku ? { sku: v.sku } : {}),
        })),
      }
    : {
        "@type": "Offer",
        url: productUrl,
        price: resolvedProduct.price,
        priceCurrency: displayCurrency,
        priceValidUntil,
        availability: productInStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      }

  const faqs: { question: string; answer: string }[] = Array.isArray(product.faqs) ? product.faqs : []

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: productUrl,
    ...(product.description ? { description: product.description } : {}),
    ...(resolvedImageUrls.length > 0 ? { image: resolvedImageUrls } : {}),
    ...(product.sku && !hasOptions ? { sku: product.sku } : {}),
    offers: offersSchema,
  }

  const faqJsonLd = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: store.name || "Store", item: storeUrl },
      ...(collectionName
        ? [{ "@type": "ListItem", position: 2, name: collectionName, item: collectionSlug ? `${storeUrl}/collections/${collectionSlug}` : storeUrl }]
        : []),
      { "@type": "ListItem", position: collectionName ? 3 : 2, name: product.name },
    ],
  }

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <PixelViewContent productName={product.name} productId={product.id} price={resolvedProduct.price} currency={displayCurrency} />
      <TiktokPixelViewContent productName={product.name} productId={product.id} price={resolvedProduct.price} currency={displayCurrency} />
      <ProductImageGallery images={resolvedImageUrls} productName={product.name} />

      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {ds.showProductSku && product.sku && !hasOptions && (
          <p className="text-sm text-muted-foreground">{t("storefront.sku")}: {product.sku}</p>
        )}

        {!hasOptions && (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>
              {formatPriceSymbol(resolvedProduct.price, displayCurrency)}
            </span>
            {resolvedProduct.compare_at_price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPriceSymbol(resolvedProduct.compare_at_price, displayCurrency)}
              </span>
            )}
          </div>
        )}

        {ds.showStockBadge && !hasOptions && (
          <div className="flex items-center gap-1.5">
            {productInStock ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600">{t("storefront.inStock")}</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-500">{t("storefront.outOfStock")}</span>
              </>
            )}
          </div>
        )}

        {product.description && (
          <section>
            <h2 className="sr-only">{t("storefront.description")}</h2>
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          </section>
        )}

        {hasOptions ? (
          <VariantSelector
            product={{
              id: product.id,
              name: product.name,
              price: resolvedProduct.price,
              imageUrl: resolvedImageUrls[0] || null,
            }}
            options={product.options as { name: string; values: string[] }[]}
            variants={variants}
            storeSlug={slug}
          />
        ) : (
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: resolvedProduct.price,
              imageUrl: resolvedImageUrls[0] || null,
              isAvailable: productInStock,
            }}
            storeSlug={slug}
          />
        )}
      </div>

      {faqs.length > 0 && (
        <section className="space-y-4 border-t pt-6">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--store-heading-font)" }}
          >
            {t("storefront.faq")}
          </h2>
          {ds.faqStyle === "accordion" ? (
            <FaqAccordion faqs={faqs} />
          ) : (
            <div style={{ display: "grid", gap: "var(--store-grid-gap, 0.75rem)" }}>
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="store-card"
                  style={{
                    borderRadius: "var(--store-radius)",
                    boxShadow: "var(--store-card-shadow)",
                    padding: "var(--store-card-padding)",
                  }}
                >
                  <h3
                    className="text-sm font-semibold leading-snug"
                    style={{ fontFamily: "var(--store-heading-font)" }}
                  >
                    {faq.question}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
