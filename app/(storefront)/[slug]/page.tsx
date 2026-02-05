import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/store/product-card"
import { CollectionTabs } from "@/components/store/collection-tabs"

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ collection?: string }>
}) {
  const { slug } = await params
  const { collection } = await searchParams
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("id, description, delivery_note")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) notFound()

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug")
    .eq("store_id", store.id)
    .order("sort_order")

  let productsQuery = supabase
    .from("products")
    .select("id, name, price, compare_at_price, image_urls, is_available, product_type, external_url")
    .eq("store_id", store.id)
    .eq("is_available", true)
    .order("sort_order")

  if (collection) {
    const activeCollection = collections?.find((c) => c.slug === collection)
    if (activeCollection) {
      productsQuery = productsQuery.eq("collection_id", activeCollection.id)
    }
  }

  const { data: products } = await productsQuery

  return (
    <div className="space-y-6">
      {store.description && (
        <p className="text-muted-foreground">{store.description}</p>
      )}

      {store.delivery_note && (
        <div className="rounded-md bg-muted p-3 text-sm">{store.delivery_note}</div>
      )}

      <CollectionTabs storeSlug={slug} collections={collections || []} />

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={slug} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No products available
        </div>
      )}
    </div>
  )
}
