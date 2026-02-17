import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, subtotal } = body

    if (!slug || subtotal == null) {
      return NextResponse.json(null)
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

    if (!store) return NextResponse.json(null)

    const now = new Date().toISOString()

    const { data: discounts } = await supabase
      .from("discounts")
      .select("*")
      .eq("store_id", store.id)
      .eq("type", "automatic")
      .eq("is_active", true)

    if (!discounts || discounts.length === 0) return NextResponse.json(null)

    let bestDiscount: typeof discounts[0] | null = null
    let bestAmount = 0

    for (const d of discounts) {
      if (d.starts_at && d.starts_at > now) continue
      if (d.ends_at && d.ends_at < now) continue
      if (d.max_uses && d.times_used >= d.max_uses) continue
      if (d.minimum_order_amount && subtotal < d.minimum_order_amount) continue

      let amount: number
      if (d.discount_type === "percentage") {
        amount = Math.round(subtotal * d.discount_value / 100 * 100) / 100
      } else {
        amount = d.discount_value
      }
      amount = Math.min(amount, subtotal)

      if (amount > bestAmount) {
        bestAmount = amount
        bestDiscount = d
      }
    }

    if (!bestDiscount) return NextResponse.json(null)

    return NextResponse.json({
      discount_id: bestDiscount.id,
      label: bestDiscount.label,
      discount_type: bestDiscount.discount_type,
      discount_value: bestDiscount.discount_value,
      discount_amount: bestAmount,
    })
  } catch {
    return NextResponse.json(null)
  }
}
