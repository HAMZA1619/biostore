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
          item["@type"] === "ProductGroup" ||
          item["@type"]?.includes?.("Product")
        ) {
          return item as Record<string, unknown>
        }
        if (item["@graph"] && Array.isArray(item["@graph"])) {
          for (const graphItem of item["@graph"]) {
            if (
              graphItem["@type"] === "Product" ||
              graphItem["@type"] === "ProductGroup" ||
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
    if (!src || images.length >= 20) return
    const absolute = makeAbsolute(src, baseUrl)
    if (absolute && !seen.has(absolute)) {
      seen.add(absolute)
      images.push(absolute)
    }
  }

  // 1. JSON-LD images
  if (jsonLd?.image) {
    if (Array.isArray(jsonLd.image)) {
      for (const img of jsonLd.image) {
        if (typeof img === "string") add(img)
        else if (img?.url) add(img.url as string)
        else if (img?.contentUrl) add(img.contentUrl as string)
      }
    } else if (typeof jsonLd.image === "string") {
      add(jsonLd.image)
    } else if ((jsonLd.image as Record<string, unknown>)?.url) {
      add((jsonLd.image as Record<string, unknown>).url as string)
    }
  }

  // 2. Images from hasVariant items
  if (jsonLd?.hasVariant && Array.isArray(jsonLd.hasVariant)) {
    for (const variant of jsonLd.hasVariant as Record<string, unknown>[]) {
      if (variant.image) {
        if (typeof variant.image === "string") add(variant.image)
        else if (Array.isArray(variant.image)) {
          for (const img of variant.image) {
            if (typeof img === "string") add(img)
            else if (img?.url) add(img.url as string)
          }
        } else if ((variant.image as Record<string, unknown>)?.url) {
          add((variant.image as Record<string, unknown>).url as string)
        }
      }
    }
  }

  // 3. OG image tags
  for (const ogImg of extractAllMeta(html, "og:image")) {
    add(ogImg)
  }

  // 4. Twitter card image
  add(extractMeta(html, "twitter:image"))

  // 5. Product gallery images from data attributes
  const dataImgRegex = /(?:data-zoom-image|data-large[_-]image|data-full[_-]image|data-src)=["']([^"']+)/gi
  let dataMatch
  while ((dataMatch = dataImgRegex.exec(html)) !== null) {
    if (/\.(jpg|jpeg|png|gif|webp|avif)/i.test(dataMatch[1])) {
      add(dataMatch[1])
    }
  }

  return images
}

function extractPriceFromHtml(html: string): number | null {
  const ogPrice = extractMeta(html, "og:price:amount") ||
    extractMeta(html, "product:price:amount")
  if (ogPrice) {
    const parsed = parseFloat(ogPrice)
    if (!isNaN(parsed)) return parsed
  }

  const itempropMatch = html.match(/<[^>]*itemprop=["']price["'][^>]*content=["']([^"']*)["']/i)
  if (itempropMatch) {
    const parsed = parseFloat(itempropMatch[1])
    if (!isNaN(parsed)) return parsed
  }

  return null
}

interface ScrapedVariant {
  options: Record<string, string>
  price: number
  sku: string
  is_available: boolean
}

interface ScrapedOption {
  name: string
  values: string[]
}

function extractVariantsFromJsonLd(jsonLd: Record<string, unknown>): {
  options: ScrapedOption[]
  variants: ScrapedVariant[]
} | null {
  // 1. Check hasVariant (ProductGroup pattern)
  if (jsonLd.hasVariant && Array.isArray(jsonLd.hasVariant)) {
    const variantItems = jsonLd.hasVariant as Record<string, unknown>[]
    if (variantItems.length > 0) {
      return parseVariantItems(variantItems)
    }
  }

  // 2. Check offers array (multiple offers = variants)
  const offers = jsonLd.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
  if (!offers) return null

  const offerList = Array.isArray(offers) ? offers : [offers]
  if (offerList.length <= 1) return null

  // Multiple offers with distinguishing features → treat as variants
  const hasNames = offerList.some((o) => o.name && typeof o.name === "string")
  const hasSkus = offerList.some((o) => o.sku && typeof o.sku === "string")

  if (!hasNames && !hasSkus) return null

  return parseOffersAsVariants(offerList)
}

function parseVariantItems(items: Record<string, unknown>[]): {
  options: ScrapedOption[]
  variants: ScrapedVariant[]
} | null {
  const optionMap = new Map<string, Set<string>>()
  const variants: ScrapedVariant[] = []

  for (const item of items) {
    const variantOptions: Record<string, string> = {}

    // Extract options from additionalProperty
    if (item.additionalProperty && Array.isArray(item.additionalProperty)) {
      for (const prop of item.additionalProperty as Record<string, unknown>[]) {
        const name = prop.name as string
        const value = prop.value as string
        if (name && value) {
          variantOptions[name] = value
          if (!optionMap.has(name)) optionMap.set(name, new Set())
          optionMap.get(name)!.add(value)
        }
      }
    }

    // Extract options from name if no additionalProperty
    if (Object.keys(variantOptions).length === 0 && item.name && typeof item.name === "string") {
      const parts = (item.name as string).split(/\s*[\/\-|]\s*/)
      if (parts.length > 0) {
        const optName = parts.length === 1 ? "Option" : "Variant"
        variantOptions[optName] = (item.name as string).trim()
        if (!optionMap.has(optName)) optionMap.set(optName, new Set())
        optionMap.get(optName)!.add((item.name as string).trim())
      }
    }

    // Extract price
    let price = 0
    const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
    if (offers) {
      const offerList = Array.isArray(offers) ? offers : [offers]
      for (const offer of offerList) {
        const p = offer.price ?? offer.lowPrice
        if (p) {
          const parsed = parseFloat(String(p))
          if (!isNaN(parsed)) { price = parsed; break }
        }
      }
    }
    if (!price && item.price) {
      const parsed = parseFloat(String(item.price))
      if (!isNaN(parsed)) price = parsed
    }

    // Availability
    const availability = getAvailability(item)

    variants.push({
      options: variantOptions,
      price,
      sku: (item.sku as string) || "",
      is_available: availability,
    })
  }

  if (variants.length === 0) return null

  const options: ScrapedOption[] = Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }))

  return { options, variants }
}

function parseOffersAsVariants(offers: Record<string, unknown>[]): {
  options: ScrapedOption[]
  variants: ScrapedVariant[]
} | null {
  const optionMap = new Map<string, Set<string>>()
  const variants: ScrapedVariant[] = []

  for (const offer of offers) {
    const variantOptions: Record<string, string> = {}

    // Extract from additionalProperty on offers
    if (offer.additionalProperty && Array.isArray(offer.additionalProperty)) {
      for (const prop of offer.additionalProperty as Record<string, unknown>[]) {
        const name = prop.name as string
        const value = prop.value as string
        if (name && value) {
          variantOptions[name] = value
          if (!optionMap.has(name)) optionMap.set(name, new Set())
          optionMap.get(name)!.add(value)
        }
      }
    }

    // Use offer name as variant label
    if (Object.keys(variantOptions).length === 0 && offer.name && typeof offer.name === "string") {
      const name = (offer.name as string).trim()
      // Try to parse "Key: Value" or "Value1 / Value2" patterns
      const colonParts = name.split(/\s*:\s*/)
      if (colonParts.length === 2) {
        variantOptions[colonParts[0]] = colonParts[1]
        if (!optionMap.has(colonParts[0])) optionMap.set(colonParts[0], new Set())
        optionMap.get(colonParts[0])!.add(colonParts[1])
      } else {
        variantOptions["Variant"] = name
        if (!optionMap.has("Variant")) optionMap.set("Variant", new Set())
        optionMap.get("Variant")!.add(name)
      }
    }

    if (Object.keys(variantOptions).length === 0) continue

    const price = parseFloat(String(offer.price ?? offer.lowPrice ?? 0)) || 0
    const availability = getAvailability(offer)

    variants.push({
      options: variantOptions,
      price,
      sku: (offer.sku as string) || "",
      is_available: availability,
    })
  }

  if (variants.length === 0) return null

  const options: ScrapedOption[] = Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }))

  return { options, variants }
}

function getAvailability(item: Record<string, unknown>): boolean {
  const avail = (item.availability as string) || ""
  if (avail.includes("OutOfStock") || avail.includes("Discontinued")) return false

  const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
  if (offers) {
    const offerList = Array.isArray(offers) ? offers : [offers]
    for (const offer of offerList) {
      const a = (offer.availability as string) || ""
      if (a.includes("OutOfStock") || a.includes("Discontinued")) return false
    }
  }

  return true
}

function extractOptionsFromHtml(html: string): ScrapedOption[] {
  const options: ScrapedOption[] = []
  const seen = new Set<string>()

  // Match <select> elements with product-related names/labels
  const selectRegex = /<select[^>]*(?:name|id|data-option)=["']([^"']*)["'][^>]*>([\s\S]*?)<\/select>/gi
  let selectMatch
  while ((selectMatch = selectRegex.exec(html)) !== null) {
    const selectName = selectMatch[1]
    const selectBody = selectMatch[2]

    // Skip quantity, country, currency selects
    if (/qty|quantity|country|currency|language|sort|page/i.test(selectName)) continue

    // Extract option values
    const optionRegex = /<option[^>]*value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/gi
    const values: string[] = []
    let optMatch
    while ((optMatch = optionRegex.exec(selectBody)) !== null) {
      const val = optMatch[2].trim() || optMatch[1].trim()
      if (val && !/select|choose|pick/i.test(val) && val !== "--") {
        values.push(val)
      }
    }

    if (values.length > 0) {
      // Clean up option name
      const cleanName = selectName
        .replace(/^(option|product[-_]?)/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\d+$/, "")
        .trim()

      const name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "Option"

      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase())
        options.push({ name, values })
      }
    }
  }

  return options
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
    let sku: string | null = null

    if (jsonLd) {
      title = (jsonLd.name as string) || null
      description = (jsonLd.description as string) || null
      price = extractPrice(jsonLd)
      sku = (jsonLd.sku as string) || null
    }

    // Fill gaps with Open Graph / meta tags
    if (!title) title = extractMeta(html, "og:title")
    if (!description) description = extractMeta(html, "og:description")
    if (!price) price = extractPriceFromHtml(html)

    // Final fallbacks
    if (!title) title = extractTitle(html)
    if (!description) description = extractMeta(html, "description")

    // Extract images (up to 20)
    const images = extractImages(jsonLd, html, url)

    // Extract variants and options
    let options: ScrapedOption[] = []
    let variants: ScrapedVariant[] = []

    if (jsonLd) {
      const variantData = extractVariantsFromJsonLd(jsonLd)
      if (variantData) {
        options = variantData.options
        variants = variantData.variants
      }
    }

    // Fallback: extract options from HTML selects if no JSON-LD variants
    if (options.length === 0) {
      options = extractOptionsFromHtml(html)
    }

    // SKU fallback from HTML
    if (!sku) {
      const skuMatch = html.match(/<[^>]*itemprop=["']sku["'][^>]*content=["']([^"']*)["']/i)
      if (skuMatch) sku = skuMatch[1]
    }

    return NextResponse.json({
      title: title || null,
      description: description || null,
      images,
      price: price && !isNaN(price) ? price : null,
      sku: sku || null,
      options,
      variants,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch URL" },
      { status: 500 }
    )
  }
}
