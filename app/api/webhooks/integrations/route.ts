import { createAdminClient } from "@/lib/supabase/admin"
import { dispatchSingle } from "@/lib/integrations/handlers"
import { APPS } from "@/lib/integrations/registry"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const event = body.record

    if (event && typeof event.payload === "string") {
      try { event.payload = JSON.parse(event.payload) } catch {}
    }

    if (!event?.id || !event?.store_id || !event?.event_type) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Only process trigger rows (integration_id is null or '_trigger', status pending).
    // Dispatch rows have a real integration_id and would re-trigger this
    // webhook — skip them to prevent duplicate events.
    const isTriggerRow = !event.integration_id || event.integration_id === "_trigger"
    if (!isTriggerRow || event.status !== "pending") {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const supabase = createAdminClient()

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, currency, language")
      .eq("id", event.store_id)
      .single()

    if (!store) {
      await supabase
        .from("integration_events")
        .update({ status: "failed", error: "Store not found", processed_at: new Date().toISOString() })
        .eq("id", event.id)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: integrations } = await supabase
      .from("store_integrations")
      .select("integration_id, config")
      .eq("store_id", event.store_id)

    const eligible = (integrations || []).filter((i) => {
      const def = APPS[i.integration_id]
      return def && def.events.includes(event.event_type)
    })

    if (eligible.length === 0) {
      await supabase
        .from("integration_events")
        .delete()
        .eq("id", event.id)
      return NextResponse.json({ ok: true, dispatched: 0 })
    }

    let enrichedPayload = event.payload || {}
    if (event.event_type === "order.created" && enrichedPayload.order_id) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, product_price, quantity, variant_options")
        .eq("order_id", enrichedPayload.order_id)
      if (items && items.length > 0) {
        enrichedPayload = { ...enrichedPayload, items }
      }
    }

    // Remove the trigger row — per-integration rows below are the real records
    await supabase
      .from("integration_events")
      .delete()
      .eq("id", event.id)

    // Process each integration independently with its own event row
    const results: { integration_id: string; status: string; error?: string }[] = []

    await Promise.allSettled(
      eligible.map(async (integration) => {
        const { data: appEvent } = await supabase
          .from("integration_events")
          .insert({
            store_id: event.store_id,
            integration_id: integration.integration_id,
            event_type: event.event_type,
            payload: enrichedPayload,
            status: "processing",
          })
          .select("id")
          .single()

        const appEventId = appEvent?.id

        try {
          await dispatchSingle(
            { event_type: event.event_type, payload: enrichedPayload },
            integration,
            { name: store.name, currency: store.currency, language: store.language },
          )

          if (appEventId) {
            await supabase
              .from("integration_events")
              .update({ status: "completed", processed_at: new Date().toISOString() })
              .eq("id", appEventId)
          }

          results.push({ integration_id: integration.integration_id, status: "completed" })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error"

          if (appEventId) {
            await supabase
              .from("integration_events")
              .update({ status: "failed", error: errorMsg, processed_at: new Date().toISOString() })
              .eq("id", appEventId)
          }

          results.push({ integration_id: integration.integration_id, status: "failed", error: errorMsg })
        }
      })
    )

    return NextResponse.json({ ok: true, dispatched: eligible.length, results })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
