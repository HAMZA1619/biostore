import { createAdminClient } from "@/lib/supabase/admin"
import { dispatchEvent } from "@/lib/integrations/handlers"
import { APPS } from "@/lib/integrations/registry"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const webhookSecret = process.env.INTEGRATION_WEBHOOK_SECRET
    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const event = body.record
    if (!event?.id || !event?.store_id || !event?.event_type) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createAdminClient()

    await supabase
      .from("integration_events")
      .update({ status: "processing" })
      .eq("id", event.id)

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, currency, language")
      .eq("id", event.store_id)
      .single()

    if (!store) {
      await supabase
        .from("integration_events")
        .update({
          status: "failed",
          error: "Store not found",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: integrations } = await supabase
      .from("store_integrations")
      .select("integration_id, config")
      .eq("store_id", event.store_id)
      .eq("is_enabled", true)

    if (!integrations || integrations.length === 0) {
      await supabase
        .from("integration_events")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id)
      return NextResponse.json({ ok: true, dispatched: 0 })
    }

    const eligible = integrations.filter((i) => {
      const def = APPS[i.integration_id]
      return def && def.events.includes(event.event_type)
    })

    let enrichedPayload = event.payload
    if (event.event_type === "order.created" && event.payload.order_id) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, product_price, quantity, variant_options")
        .eq("order_id", event.payload.order_id)
      if (items && items.length > 0) {
        enrichedPayload = { ...event.payload, items }
      }
    }

    const errors = await dispatchEvent(
      { event_type: event.event_type, payload: enrichedPayload },
      eligible,
      { name: store.name, currency: store.currency, language: store.language }
    )

    await supabase
      .from("integration_events")
      .update({
        status: errors.length > 0 ? "failed" : "completed",
        error: errors.length > 0 ? errors.join("; ") : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", event.id)

    return NextResponse.json({
      ok: true,
      dispatched: eligible.length,
      errors,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
