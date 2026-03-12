import urlJoin from "url-join"
import type { MetadataRoute } from "next"
import { CATEGORIES, ARTICLES } from "@/lib/docs/content"

export default function sitemap(): MetadataRoute.Sitemap {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const baseUrl = rootDomain
    ? `https://${rootDomain}`
    : process.env.NEXT_PUBLIC_APP_URL || "https://leadivo.app"

  const docCategoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: urlJoin(baseUrl, "docs", cat.slug),
    lastModified: new Date("2026-03-01"),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const docArticlePages: MetadataRoute.Sitemap = ARTICLES.map((article) => {
    const category = CATEGORIES.find((c) => c.slug === article.category)
    return {
      url: urlJoin(baseUrl, "docs", category?.slug ?? article.category, article.slug),
      lastModified: new Date("2026-03-01"),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }
  })

  return [
    { url: baseUrl, lastModified: new Date("2026-03-12"), changeFrequency: "daily" as const, priority: 1.0 },
    { url: urlJoin(baseUrl, "docs"), lastModified: new Date("2026-03-01"), changeFrequency: "weekly" as const, priority: 0.8 },
    ...docCategoryPages,
    ...docArticlePages,
    { url: urlJoin(baseUrl, "privacy"), lastModified: new Date("2026-01-01"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: urlJoin(baseUrl, "terms"), lastModified: new Date("2026-01-01"), changeFrequency: "yearly" as const, priority: 0.3 },
  ]
}
