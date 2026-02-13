import { parseDesignSettings } from "@/lib/utils"
import { notFound } from "next/navigation"
import { CollectionTabs } from "@/components/store/collection-tabs"
import { SearchInput } from "@/components/store/search-input"
import { ViewTracker } from "@/components/store/view-tracker"
import { ProductGrid } from "@/components/store/product-grid"
import { getStoreBySlug, getStoreCollections, getStoreProducts, resolveImageUrls } from "@/lib/storefront/cache"

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

  const store = await getStoreBySlug(slug, "id, description, design_settings")

  if (!store) notFound()

  const collections = await getStoreCollections(store.id)

  let activeCollectionId: string | null = null
  if (collection) {
    const activeCollection = collections?.find((c) => c.slug === collection)
    if (activeCollection) activeCollectionId = activeCollection.id
  }

  const rawProducts = await getStoreProducts(store.id, 0, PAGE_SIZE, activeCollectionId, search)

  // Resolve image IDs to URLs
  const allImageIds = (rawProducts || []).flatMap((p) => p.image_urls || [])
  const imageMap = await resolveImageUrls(allImageIds)
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
