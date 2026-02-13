import type { MetadataRoute } from "next"
import { createStaticClient } from "@/lib/supabase/static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://biostore.app"

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const supabase = createStaticClient()

  const { data: stores } = await supabase
    .from("stores")
    .select("slug, updated_at")
    .eq("is_published", true)

  const storePages: MetadataRoute.Sitemap = (stores || []).map((store) => ({
    url: `${baseUrl}/${store.slug}`,
    lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  return [...staticPages, ...storePages]
}
