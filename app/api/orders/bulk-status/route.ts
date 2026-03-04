import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/constants"

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { order_ids, status } = await request.json() as { order_ids: string[]; status: string }

    if (!Array.isArray(order_ids) || order_ids.length === 0 || !status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Fetch current orders
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status")
      .eq("store_id", store.id)
      .in("id", order_ids)

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 })
    }

    let updated = 0
    let skipped = 0
    const now = new Date().toISOString()

    // Update each order individually to trigger DB triggers for WhatsApp notifications
    for (const order of orders) {
      const validTransitions = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] || []
      if (!validTransitions.includes(status as OrderStatus)) {
        skipped++
        continue
      }

      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: now })
        .eq("id", order.id)

      if (error) {
        skipped++
      } else {
        updated++
      }
    }

    return NextResponse.json({ ok: true, updated, skipped })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
