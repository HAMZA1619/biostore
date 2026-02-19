import urlJoin from "url-join"
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://biostore.app"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/login", "/signup"],
      },
    ],
    sitemap: urlJoin(baseUrl, "sitemap.xml"),
  }
}
