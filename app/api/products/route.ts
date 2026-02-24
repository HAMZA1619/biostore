import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { resolveImageUrls } from "@/lib/storefront/cache"
import { resolvePrice } from "@/lib/market/resolve-price"
import type { MarketInfo } from "@/lib/market/resolve-price"

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const storeId = searchParams.get("store_id")
    const collectionId = searchParams.get("collection_id")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "0", 10)
    const marketId = searchParams.get("market_id")

    if (!storeId) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase
      .from("products")
      .select("id, name, price, compare_at_price, image_urls, is_available, stock, options, product_variants(price)")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("sort_order")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (collectionId) {
      query = query.eq("collection_id", collectionId)
    }

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data: rawProducts, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Fetch market info and store currency for price resolution
    let activeMarket: MarketInfo | null = null
    let storeCurrency = "MAD"
    let marketPricesMap = new Map<string, { price: number; compare_at_price: number | null }>()

    if (marketId) {
      const { data: market } = await supabase
        .from("markets")
        .select("id, currency, pricing_mode, price_adjustment, store_id")
        .eq("id", marketId)
        .eq("is_active", true)
        .single()

      if (market && market.store_id === storeId) {
        activeMarket = {
          id: market.id,
          currency: market.currency,
          pricing_mode: market.pricing_mode as "fixed" | "auto",
          price_adjustment: Number(market.price_adjustment),
        }

        if (market.pricing_mode === "fixed" && rawProducts && rawProducts.length > 0) {
          const productIds = rawProducts.map((p) => p.id)
          const { data: mp } = await supabase
            .from("market_prices")
            .select("product_id, variant_id, price, compare_at_price")
            .eq("market_id", marketId)
            .in("product_id", productIds)

          for (const row of mp || []) {
            if (!row.variant_id) {
              marketPricesMap.set(row.product_id, { price: Number(row.price), compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null })
            }
          }
        }
      }
    }

    // Always fetch store currency for fallback
    const { data: storeData } = await supabase
      .from("stores")
      .select("currency")
      .eq("id", storeId)
      .single()
    if (storeData) storeCurrency = storeData.currency

    // Resolve image IDs to URLs
    const allImageIds = (rawProducts || []).flatMap((p) => p.image_urls || [])
    const imageMap = await resolveImageUrls(allImageIds)
    const products = (rawProducts || []).map((p) => {
      const resolved = resolvePrice(
        Number(p.price),
        p.compare_at_price ? Number(p.compare_at_price) : null,
        storeCurrency,
        activeMarket,
        marketPricesMap.get(p.id) || null,
      )
      // Apply market auto-adjustment to variant display prices ("From X")
      const adjustedVariants = activeMarket?.pricing_mode === "auto" && p.product_variants?.length
        ? p.product_variants.map((v: { price: number }) => ({
            price: Math.round(v.price * (1 + activeMarket.price_adjustment / 100) * 100) / 100,
          }))
        : p.product_variants
      return {
        ...p,
        price: resolved.price,
        compare_at_price: resolved.compare_at_price,
        product_variants: adjustedVariants,
        image_urls: (p.image_urls || []).map((id: string) => imageMap.get(id)).filter(Boolean) as string[],
      }
    })

    return NextResponse.json({
      products,
      hasMore: (rawProducts?.length || 0) === PAGE_SIZE,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
