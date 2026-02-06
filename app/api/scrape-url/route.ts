import { NextResponse } from "next/server"

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  )
  const match = html.match(regex)
  return match ? (match[1] || match[2] || null) : null
}

function extractAllMeta(html: string, property: string): string[] {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "gi"
  )
  const results: string[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    const val = match[1] || match[2]
    if (val) results.push(val)
  }
  return results
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
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (
          item["@type"] === "Product" ||
          item["@type"]?.includes?.("Product")
        ) {
          return item as Record<string, unknown>
        }
        // Check @graph array (common in many sites)
        if (item["@graph"] && Array.isArray(item["@graph"])) {
          for (const graphItem of item["@graph"]) {
            if (
              graphItem["@type"] === "Product" ||
              graphItem["@type"]?.includes?.("Product")
            ) {
              return graphItem as Record<string, unknown>
            }
          }
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null
}

function extractPrice(jsonLd: Record<string, unknown>): number | null {
  const offers = jsonLd.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
  if (!offers) return null

  const offerList = Array.isArray(offers) ? offers : [offers]
  for (const offer of offerList) {
    const p = offer.price ?? offer.lowPrice
    if (p) {
      const parsed = parseFloat(String(p))
      if (!isNaN(parsed)) return parsed
    }
    // Handle AggregateOffer
    if (offer["@type"] === "AggregateOffer") {
      const lowPrice = offer.lowPrice ?? offer.price
      if (lowPrice) {
        const parsed = parseFloat(String(lowPrice))
        if (!isNaN(parsed)) return parsed
      }
    }
  }
  return null
}

function makeAbsolute(src: string, baseUrl: string): string | null {
  if (src.startsWith("http")) return src
  try {
    const base = new URL(baseUrl)
    return new URL(src, base.origin).toString()
  } catch {
    return null
  }
}

function extractImages(jsonLd: Record<string, unknown> | null, html: string, baseUrl: string): string[] {
  const seen = new Set<string>()
  const images: string[] = []

  function add(src: string | null | undefined) {
    if (!src || images.length >= 5) return
    const absolute = makeAbsolute(src, baseUrl)
    if (absolute && !seen.has(absolute)) {
      seen.add(absolute)
      images.push(absolute)
    }
  }

  // 1. JSON-LD images (most reliable)
  if (jsonLd?.image) {
    if (Array.isArray(jsonLd.image)) {
      for (const img of jsonLd.image) {
        if (typeof img === "string") add(img)
        else if (img?.url) add(img.url as string)
      }
    } else if (typeof jsonLd.image === "string") {
      add(jsonLd.image)
    } else if ((jsonLd.image as Record<string, unknown>)?.url) {
      add((jsonLd.image as Record<string, unknown>).url as string)
    }
  }

  // 2. OG image tags (sites often have multiple)
  for (const ogImg of extractAllMeta(html, "og:image")) {
    add(ogImg)
  }

  // 3. Twitter card image
  add(extractMeta(html, "twitter:image"))

  return images
}

function extractPriceFromHtml(html: string): number | null {
  // og:price or product:price meta tags
  const ogPrice = extractMeta(html, "og:price:amount") ||
    extractMeta(html, "product:price:amount")
  if (ogPrice) {
    const parsed = parseFloat(ogPrice)
    if (!isNaN(parsed)) return parsed
  }

  // itemprop="price" with content attribute
  const itempropMatch = html.match(/<[^>]*itemprop=["']price["'][^>]*content=["']([^"']*)["']/i)
  if (itempropMatch) {
    const parsed = parseFloat(itempropMatch[1])
    if (!isNaN(parsed)) return parsed
  }

  return null
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,ar;q=0.7",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${res.status})` },
        { status: 422 }
      )
    }

    const html = await res.text()

    const jsonLd = extractJsonLd(html)

    let title: string | null = null
    let description: string | null = null
    let price: number | null = null

    if (jsonLd) {
      title = (jsonLd.name as string) || null
      description = (jsonLd.description as string) || null
      price = extractPrice(jsonLd)
    }

    // Fill gaps with Open Graph / meta tags
    if (!title) title = extractMeta(html, "og:title")
    if (!description) description = extractMeta(html, "og:description")
    if (!price) price = extractPriceFromHtml(html)

    // Final fallbacks
    if (!title) title = extractTitle(html)
    if (!description) description = extractMeta(html, "description")

    // Extract up to 5 images
    const images = extractImages(jsonLd, html, url)

    return NextResponse.json({
      title: title || null,
      description: description || null,
      images,
      image: images[0] || null,
      price: price && !isNaN(price) ? price : null,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch URL" },
      { status: 500 }
    )
  }
}
