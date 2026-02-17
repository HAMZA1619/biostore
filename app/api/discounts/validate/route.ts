import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")
    if (!slug) return NextResponse.json({ has_discounts: false })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (!store) return NextResponse.json({ has_discounts: false })

    const { count } = await supabase
      .from("discounts")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("is_active", true)

    return NextResponse.json({ has_discounts: (count ?? 0) > 0 })
  } catch {
    return NextResponse.json({ has_discounts: false })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, code, subtotal, customer_phone } = body

    if (!slug || !code || subtotal == null) {
      return NextResponse.json({ valid: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (!store) {
      return NextResponse.json({ valid: false, error: "Store not found" }, { status: 404 })
    }

    const { data: discount } = await supabase
      .from("discounts")
      .select("*")
      .eq("store_id", store.id)
      .eq("type", "code")
      .ilike("code", code.trim())
      .eq("is_active", true)
      .single()

    if (!discount) {
      return NextResponse.json({ valid: false, error: "invalid_code" })
    }

    const now = new Date()

    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({ valid: false, error: "not_started" })
    }

    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return NextResponse.json({ valid: false, error: "expired" })
    }

    if (discount.max_uses && discount.times_used >= discount.max_uses) {
      return NextResponse.json({ valid: false, error: "max_uses_reached" })
    }

    if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
      return NextResponse.json({ valid: false, error: "minimum_not_met", minimum: discount.minimum_order_amount })
    }

    if (discount.max_uses_per_customer && customer_phone) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("discount_id", discount.id)
        .eq("customer_phone", customer_phone)

      if (count && count >= discount.max_uses_per_customer) {
        return NextResponse.json({ valid: false, error: "per_customer_limit" })
      }
    }

    let discountAmount: number
    if (discount.discount_type === "percentage") {
      discountAmount = Math.round(subtotal * discount.discount_value / 100 * 100) / 100
    } else {
      discountAmount = discount.discount_value
    }
    discountAmount = Math.min(discountAmount, subtotal)

    return NextResponse.json({
      valid: true,
      discount_id: discount.id,
      label: discount.label,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      discount_amount: discountAmount,
    })
  } catch {
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
