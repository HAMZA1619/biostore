import { createClient } from "@/lib/supabase/server"
import { parseDesignSettings } from "@/lib/utils"
import { notFound } from "next/navigation"
import { CollectionTabs } from "@/components/store/collection-tabs"
import { SearchInput } from "@/components/store/search-input"
import { ViewTracker } from "@/components/store/view-tracker"
import { ProductGrid } from "@/components/store/product-grid"

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
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("id, description, design_settings")
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

  if (search) {
    productsQuery = productsQuery.ilike("name", `%${search}%`)
  }

  const { data: rawProducts } = await productsQuery

  // Resolve image IDs to URLs
  const allImageIds = (rawProducts || []).flatMap((p) => p.image_urls || [])
  const imageMap = new Map<string, string>()
  if (allImageIds.length > 0) {
    const { data: imgs } = await supabase.from("store_images").select("id, url").in("id", allImageIds)
    for (const img of imgs || []) imageMap.set(img.id, img.url)
  }
  const products = (rawProducts || []).map((p) => ({
    ...p,
    image_urls: (p.image_urls || []).map((id: string) => imageMap.get(id)).filter(Boolean) as string[],
  }))

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
      />
    </div>
  )
}
