import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { market_id, prices } = body as {
      market_id: string
      prices: Array<{
        product_id: string
        variant_id: string | null
        price: number
        compare_at_price: number | null
      }>
    }

    if (!market_id) return NextResponse.json({ error: "market_id required" }, { status: 400 })

    // Verify market exists and user owns the store
    const { data: market } = await supabase
      .from("markets")
      .select("id, store_id, pricing_mode")
      .eq("id", market_id)
      .single()

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("id", market.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    if (market.pricing_mode !== "fixed") {
      return NextResponse.json({ error: "Market is not using fixed pricing" }, { status: 400 })
    }

    // Delete all existing market_prices for this market
    const { error: deleteError } = await supabase
      .from("market_prices")
      .delete()
      .eq("market_id", market_id)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to clear existing prices" }, { status: 500 })
    }

    // Insert new prices (only those with price > 0)
    const validPrices = (prices || []).filter((p) => p.price > 0)
    if (validPrices.length > 0) {
      const rows = validPrices.map((p) => ({
        market_id,
        product_id: p.product_id,
        variant_id: p.variant_id || null,
        price: p.price,
        compare_at_price: p.compare_at_price ?? null,
      }))

      const { error: insertError } = await supabase.from("market_prices").insert(rows)
      if (insertError) {
        return NextResponse.json({ error: "Failed to save prices" }, { status: 500 })
      }
    }

    revalidateTag(`market-prices:${market_id}`, "max")
    revalidateTag(`markets:${market.store_id}`, "max")
    revalidateTag(`store:${store.slug}`, "max")

    return NextResponse.json({ ok: true, count: validPrices.length })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
