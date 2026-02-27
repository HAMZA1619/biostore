import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      slug,
      customer_phone,
      customer_name,
      customer_email,
      customer_city,
      customer_country,
      customer_address,
      cart_items,
      subtotal,
      total,
      market_id,
      discount_code,
      discount_amount,
      delivery_fee,
    } = body

    if (!slug || !customer_phone || !cart_items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, currency")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (storeError || !store) {
      console.error("[checkout-sessions] Store lookup failed:", storeError)
      return NextResponse.json({ error: "Store not found", details: storeError?.message }, { status: 404 })
    }

    // Resolve currency from market if provided
    let checkoutCurrency = store.currency
    let resolvedMarketId: string | null = null

    if (market_id) {
      const { data: market } = await supabase
        .from("markets")
        .select("id, currency, store_id")
        .eq("id", market_id)
        .eq("is_active", true)
        .single()

      if (market && market.store_id === store.id) {
        checkoutCurrency = market.currency
        resolvedMarketId = market.id
      }
    }

    const { error: rpcError } = await supabase.rpc("upsert_abandoned_checkout", {
      p_store_id: store.id,
      p_customer_phone: customer_phone,
      p_customer_name: customer_name || null,
      p_customer_email: customer_email || null,
      p_customer_country: customer_country || null,
      p_customer_city: customer_city || null,
      p_customer_address: customer_address || null,
      p_cart_items: cart_items,
      p_subtotal: subtotal || 0,
      p_total: total || 0,
      p_currency: checkoutCurrency,
      p_delivery_fee: delivery_fee || 0,
      p_discount_code: discount_code || null,
      p_discount_amount: discount_amount || 0,
      p_market_id: resolvedMarketId,
    })

    if (rpcError) {
      console.error("[checkout-sessions] RPC upsert_abandoned_checkout failed:", rpcError)
      return NextResponse.json({ error: "Failed to save checkout session", details: rpcError.message, code: rpcError.code }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[checkout-sessions] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
