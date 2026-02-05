import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { AddToCartButton } from "@/components/store/add-to-cart-button"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const { slug, productId } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) notFound()

  const { data: product } = await supabase
    .from("products")
    .select("*, collections(name)")
    .eq("id", productId)
    .eq("store_id", store.id)
    .single()

  if (!product) notFound()

  // External products redirect directly to their URL
  if (product.product_type === "external" && product.external_url) {
    redirect(product.external_url)
  }

  return (
    <div className="space-y-6">
      {product.image_urls && product.image_urls.length > 0 && (
        <div className="grid gap-2">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.image_urls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.image_urls.slice(1).map((url: string, i: number) => (
                <div key={i} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
        )}

        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.image_urls?.[0] || null,
            isAvailable: product.is_available,
          }}
          storeSlug={slug}
        />
      </div>
    </div>
  )
}
