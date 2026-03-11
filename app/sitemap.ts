import urlJoin from "url-join"
import type { MetadataRoute } from "next"
import { createStaticClient } from "@/lib/supabase/static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const baseUrl = rootDomain
    ? `https://${rootDomain}`
    : process.env.NEXT_PUBLIC_APP_URL || "https://leadivo.app"

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: urlJoin(baseUrl, "docs"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: urlJoin(baseUrl, "privacy"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: urlJoin(baseUrl, "terms"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const supabase = createStaticClient()

  const { data: stores } = await supabase
    .from("stores")
    .select("slug, updated_at")
    .eq("is_published", true)

  const storePages: MetadataRoute.Sitemap = (stores || []).map((store) => ({
    url: rootDomain ? `https://${store.slug}.${rootDomain}` : urlJoin(baseUrl, store.slug),
    lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at, store_id, stores!inner(slug, is_published)")
    .eq("is_active", true)
    .eq("stores.is_published", true)

  const productPages: MetadataRoute.Sitemap = (products || []).map((product) => {
    const store = product.stores as unknown as { slug: string }
    const storeBase = rootDomain
      ? `https://${store.slug}.${rootDomain}`
      : urlJoin(baseUrl, store.slug)
    return {
      url: urlJoin(storeBase, "products", product.id),
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }
  })

  return [...staticPages, ...storePages, ...productPages]
}
