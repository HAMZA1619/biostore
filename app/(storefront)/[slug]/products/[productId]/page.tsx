import { notFound } from "next/navigation"
import { formatPriceSymbol, getImageUrl } from "@/lib/utils"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { ProductImageGallery } from "@/components/store/product-image-gallery"
import { VariantSelector } from "@/components/store/variant-selector"
import { PixelViewContent } from "@/components/store/pixel-view-content"
import { TiktokPixelViewContent } from "@/components/store/tiktok-pixel-view-content"
import { getT } from "@/lib/i18n/storefront"
import { getStoreBySlug, getProduct, getProductVariants, resolveImageUrls } from "@/lib/storefront/cache"
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
    : `${product.name} — ${formatPriceSymbol(product.price, store.currency)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const { slug, productId } = await params

  const store = await getStoreBySlug(slug, "id, language, currency")

  if (!store) notFound()

  const product = await getProduct(productId, store.id)

  if (!product) notFound()

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

    variants = (data || []).map((v) => ({
      id: v.id,
      options: v.options as Record<string, string>,
      price: v.price,
      compare_at_price: v.compare_at_price,
      sku: v.sku,
      stock: v.stock,
      is_available: v.is_available,
    }))
  }

  const productInStock = product.is_available && (product.stock === null || product.stock === undefined || product.stock > 0)
  const t = getT(store.language || "en")

  return (
    <div className="space-y-6">
      <PixelViewContent productName={product.name} productId={product.id} price={product.price} currency={store.currency} />
      <TiktokPixelViewContent productName={product.name} productId={product.id} price={product.price} currency={store.currency} />
      <ProductImageGallery images={resolvedImageUrls} productName={product.name} />

      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {product.sku && !hasOptions && (
          <p className="text-sm text-muted-foreground">{t("storefront.sku")}: {product.sku}</p>
        )}

        {!hasOptions && (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>
              {formatPriceSymbol(product.price, store.currency)}
            </span>
            {product.compare_at_price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPriceSymbol(product.compare_at_price, store.currency)}
              </span>
            )}
          </div>
        )}

        {product.description && (
          <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
        )}

        {hasOptions ? (
          <VariantSelector
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
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
              price: product.price,
              imageUrl: resolvedImageUrls[0] || null,
              isAvailable: productInStock,
            }}
            storeSlug={slug}
          />
        )}
      </div>
    </div>
  )
}
