import { NextResponse } from "next/server"

function extractMeta(html: string, property: string): string | null {
  // Match both property="..." and name="..." attributes
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  )
  const match = html.match(regex)
  return match ? (match[1] || match[2] || null) : null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match ? match[1].trim() : null
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      // Could be an array or single object
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (
          item["@type"] === "Product" ||
          item["@type"]?.includes?.("Product")
        ) {
          return item as Record<string, unknown>
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BioStore/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${res.status})` },
        { status: 422 }
      )
    }

    const html = await res.text()

    // Try JSON-LD structured data first (most reliable for products)
    const jsonLd = extractJsonLd(html)

    let title: string | null = null
    let description: string | null = null
    let image: string | null = null
    let price: number | null = null

    if (jsonLd) {
      title = (jsonLd.name as string) || null
      description = (jsonLd.description as string) || null
      image = Array.isArray(jsonLd.image)
        ? jsonLd.image[0]
        : (jsonLd.image as string) || null
      const offers = jsonLd.offers as Record<string, unknown> | undefined
      if (offers) {
        const offerPrice = offers.price ?? (offers as Record<string, unknown>)?.lowPrice
        if (offerPrice) price = parseFloat(String(offerPrice))
      }
    }

    // Fill gaps with Open Graph tags
    if (!title) title = extractMeta(html, "og:title")
    if (!description) description = extractMeta(html, "og:description")
    if (!image) image = extractMeta(html, "og:image")
    if (!price) {
      const ogPrice = extractMeta(html, "og:price:amount") ||
        extractMeta(html, "product:price:amount")
      if (ogPrice) price = parseFloat(ogPrice)
    }

    // Final fallbacks
    if (!title) title = extractTitle(html)
    if (!description) description = extractMeta(html, "description")

    // Make relative image URLs absolute
    if (image && !image.startsWith("http")) {
      const base = new URL(url)
      image = new URL(image, base.origin).toString()
    }

    return NextResponse.json({
      title: title || null,
      description: description || null,
      image: image || null,
      price: price && !isNaN(price) ? price : null,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch URL" },
      { status: 500 }
    )
  }
}
