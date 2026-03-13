import { getAllPosts } from "@/lib/blog/content"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function GET() {
  const posts = getAllPosts()

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${APP_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${APP_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${escapeXml(post.category.replace("-", " "))}</category>
      <author>${escapeXml(post.author)}</author>${post.image ? `\n      <enclosure url="${APP_URL}${post.image}" type="image/webp" length="0" />` : ""}
    </item>`
    )
    .join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Leadivo Blog</title>
    <link>${APP_URL}/blog</link>
    <description>Guides and strategies to grow your ecommerce business. Learn about social selling, COD management, and how to start selling online worldwide.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${APP_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${APP_URL}/logo.png</url>
      <title>Leadivo Blog</title>
      <link>${APP_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
