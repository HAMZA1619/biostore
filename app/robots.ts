import urlJoin from "url-join"
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : process.env.NEXT_PUBLIC_APP_URL || "https://leadivo.app"

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
