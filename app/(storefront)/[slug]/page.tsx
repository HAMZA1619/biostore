import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CollectionTabs } from "@/components/store/collection-tabs"
import { ViewTracker } from "@/components/store/view-tracker"
import { ProductGrid } from "@/components/store/product-grid"

const PAGE_SIZE = 12

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
    .select("id, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) notFound()

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug")
    .eq("store_id", store.id)
    .order("sort_order")

  let activeCollectionId: string | null = null
  if (collection) {
    const activeCollection = collections?.find((c) => c.slug === collection)
    if (activeCollection) activeCollectionId = activeCollection.id
  }

  let productsQuery = supabase
    .from("products")
    .select("id, name, price, compare_at_price, image_urls, is_available, stock, options, product_variants(price)")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("sort_order")
    .range(0, PAGE_SIZE - 1)

  if (activeCollectionId) {
    productsQuery = productsQuery.eq("collection_id", activeCollectionId)
  }

  const { data: products } = await productsQuery

  return (
    <div className="space-y-6">
      <ViewTracker storeId={store.id} />
      {store.description && (
        <p className="text-muted-foreground">{store.description}</p>
      )}

      <CollectionTabs storeSlug={slug} collections={collections || []} />

      <ProductGrid
        initialProducts={products || []}
        storeId={store.id}
        storeSlug={slug}
        collectionId={activeCollectionId}
        hasMore={(products?.length || 0) === PAGE_SIZE}
      />
    </div>
  )
}
