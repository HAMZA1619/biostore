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
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
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
      p_currency: store.currency,
    })

    if (rpcError) {
      return NextResponse.json({ error: "Failed to save checkout session" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
