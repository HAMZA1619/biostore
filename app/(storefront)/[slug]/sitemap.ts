import type { MetadataRoute } from "next"
import { createStaticClient } from "@/lib/supabase/static"
import { getStoreUrl, getImageUrl } from "@/lib/utils"

export async function generateSitemaps() {
  const supabase = createStaticClient()
  const { data: stores } = await supabase
    .from("stores")
    .select("slug")
    .eq("is_published", true)

  return (stores || []).map((s) => ({ id: s.slug }))
}

export default async function sitemap({
  id,
}: {
  id: string
}): Promise<MetadataRoute.Sitemap> {
  const slug = id
  const supabase = createStaticClient()

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) return []

  const storeUrl = getStoreUrl(store.slug)

  const [{ data: products }, { data: collections }] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, updated_at, image_urls")
      .eq("store_id", store.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("collections")
      .select("slug, created_at")
      .eq("store_id", store.id)
      .order("sort_order"),
  ])

  // Resolve all product image IDs to URLs
  const allImageIds = (products || []).flatMap((p) => (p.image_urls as string[]) || [])
  let imageMap = new Map<string, string>()
  if (allImageIds.length > 0) {
    const uniqueIds = [...new Set(allImageIds)]
    const { data: imgs } = await supabase
      .from("store_images")
      .select("id, storage_path")
      .in("id", uniqueIds.slice(0, 5000))
    for (const img of imgs || []) {
      const url = getImageUrl(img.storage_path)
      if (url) imageMap.set(img.id, url)
    }
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: storeUrl,
      lastModified: new Date(store.updated_at),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ]

  // Collection pages
  for (const collection of collections || []) {
    entries.push({
      url: `${storeUrl}/collections/${collection.slug}`,
      lastModified: new Date(collection.created_at),
      changeFrequency: "weekly",
      priority: 0.9,
    })
  }

  // Product pages with images
  for (const product of products || []) {
    const productImages = ((product.image_urls as string[]) || [])
      .map((id) => imageMap.get(id))
      .filter(Boolean) as string[]

    entries.push({
      url: `${storeUrl}/products/${product.slug || product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
      ...(productImages.length > 0 ? {
        images: productImages,
      } : {}),
    })
  }

  return entries
}
