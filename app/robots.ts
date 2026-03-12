import urlJoin from "url-join"
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/login", "/signup", "/auth/"],
      },
    ],
    sitemap: urlJoin(baseUrl, "sitemap.xml"),
  }
}
