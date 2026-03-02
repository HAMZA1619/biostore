import { createStaticClient } from "@/lib/supabase/static"
import { getExchangeRate } from "@/lib/market/exchange-rates"
import { resolvePrice } from "@/lib/market/resolve-price"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, items, market_id } = body as {
      slug: string
      items: Array<{ product_id: string; variant_id: string | null }>
      market_id: string
    }

    if (!slug || !items?.length || !market_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createStaticClient()

    const { data: store } = await supabase
      .from("stores")
      .select("id, currency")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: market } = await supabase
      .from("markets")
      .select("id, currency, pricing_mode, exchange_rate, price_adjustment")
      .eq("id", market_id)
      .eq("store_id", store.id)
      .eq("is_active", true)
      .single()

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 })
    }

    const productIds = [...new Set(items.map((i) => i.product_id))]
    const variantIds = items.map((i) => i.variant_id).filter(Boolean) as string[]

    const { data: products } = await supabase
      .from("products")
      .select("id, price, compare_at_price")
      .in("id", productIds)
      .eq("store_id", store.id)

    const productMap = new Map((products || []).map((p) => [p.id, p]))

    let variantMap = new Map<string, { price: number; compare_at_price: number | null }>()
    if (variantIds.length > 0) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, price, compare_at_price, product_id")
        .in("id", variantIds)

      for (const v of variants || []) {
        variantMap.set(v.id, { price: v.price, compare_at_price: v.compare_at_price })
      }
    }

    let marketPriceMap = new Map<string, { price: number; compare_at_price: number | null }>()
    if (market.pricing_mode === "fixed") {
      const { data: mPrices } = await supabase
        .from("market_prices")
        .select("product_id, variant_id, price, compare_at_price")
        .eq("market_id", market.id)
        .in("product_id", productIds)

      for (const mp of mPrices || []) {
        const key = mp.variant_id ? `${mp.product_id}:${mp.variant_id}` : mp.product_id
        marketPriceMap.set(key, { price: Number(mp.price), compare_at_price: mp.compare_at_price != null ? Number(mp.compare_at_price) : null })
      }
    }

    const rate = market.pricing_mode === "auto"
      ? await getExchangeRate(store.currency, market.currency)
      : Number(market.exchange_rate)

    const marketInfo = {
      id: market.id,
      currency: market.currency,
      pricing_mode: market.pricing_mode as "fixed" | "auto",
      exchange_rate: rate,
      price_adjustment: Number(market.price_adjustment),
    }

    const resolved = items.map((item) => {
      const product = productMap.get(item.product_id)
      if (!product) return { product_id: item.product_id, variant_id: item.variant_id, price: 0 }

      const variant = item.variant_id ? variantMap.get(item.variant_id) : null
      const basePrice = variant ? variant.price : product.price
      const baseCompare = variant ? variant.compare_at_price : product.compare_at_price

      const mpKey = item.variant_id ? `${item.product_id}:${item.variant_id}` : item.product_id
      const marketPrice = marketPriceMap.get(mpKey) || null

      const result = resolvePrice(basePrice, baseCompare, store.currency, marketInfo, marketPrice)

      return {
        product_id: item.product_id,
        variant_id: item.variant_id,
        price: result.price,
      }
    })

    return NextResponse.json({ items: resolved, currency: market.currency })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
