import { createAdminClient } from "@/lib/supabase/admin"
import { dispatchEvent } from "@/lib/integrations/handlers"
import { APPS } from "@/lib/integrations/registry"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const debug: string[] = []
  try {
    const body = await request.json()
    debug.push(`body_keys: ${Object.keys(body).join(",")}`)
    console.log("[WEBHOOK] Received body:", JSON.stringify(body).substring(0, 1500))

    // Supabase webhook sends { type, table, record, schema, old_record }
    const event = body.record

    // Handle payload being a string (Supabase sometimes stringifies JSONB)
    if (event && typeof event.payload === "string") {
      try {
        event.payload = JSON.parse(event.payload)
      } catch {
        debug.push("payload_parse_failed")
      }
    }

    debug.push(`record_keys: ${event ? Object.keys(event).join(",") : "null"}`)
    debug.push(`event_type: ${event?.event_type || "missing"}`)
    debug.push(`store_id: ${event?.store_id || "missing"}`)
    debug.push(`event_id: ${event?.id || "missing"}`)

    if (!event?.id || !event?.store_id || !event?.event_type) {
      debug.push("REJECTED: missing required fields")
      console.log("[WEBHOOK] Invalid payload:", debug)
      return NextResponse.json({ error: "Invalid payload", debug }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error: updateErr } = await supabase
      .from("integration_events")
      .update({ status: "processing" })
      .eq("id", event.id)

    debug.push(`status_update_to_processing: ${updateErr ? updateErr.message : "ok"}`)

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, currency, language")
      .eq("id", event.store_id)
      .single()

    debug.push(`store: ${store ? store.name : "NOT_FOUND"}`)
    if (storeError) debug.push(`store_error: ${storeError.message}`)

    if (!store) {
      await supabase
        .from("integration_events")
        .update({
          status: "failed",
          error: "Store not found",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id)
      return NextResponse.json({ error: "Store not found", debug }, { status: 404 })
    }

    const { data: integrations } = await supabase
      .from("store_integrations")
      .select("integration_id, config")
      .eq("store_id", event.store_id)
      .eq("is_enabled", true)

    debug.push(`integrations_found: ${integrations?.length || 0}`)
    if (integrations) {
      integrations.forEach((i) => {
        debug.push(`integration: ${i.integration_id}, config: ${JSON.stringify(i.config).substring(0, 200)}`)
      })
    }

    if (!integrations || integrations.length === 0) {
      await supabase
        .from("integration_events")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id)
      debug.push("RESULT: no_integrations_enabled")
      return NextResponse.json({ ok: true, dispatched: 0, debug })
    }

    const eligible = integrations.filter((i) => {
      const def = APPS[i.integration_id]
      return def && def.events.includes(event.event_type)
    })

    debug.push(`eligible: ${eligible.length} (${eligible.map((e) => e.integration_id).join(",")})`)

    let enrichedPayload = event.payload || {}
    if (event.event_type === "order.created" && enrichedPayload.order_id) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, product_price, quantity, variant_options")
        .eq("order_id", enrichedPayload.order_id)
      if (items && items.length > 0) {
        enrichedPayload = { ...enrichedPayload, items }
      }
      debug.push(`order_items: ${items?.length || 0}`)
    }

    // Check Evolution API URL
    debug.push(`EVOLUTION_API_URL: ${process.env.EVOLUTION_API_URL || "NOT_SET"}`)
    debug.push(`EVOLUTION_API_KEY: ${process.env.EVOLUTION_API_KEY ? "SET" : "NOT_SET"}`)
    debug.push(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "SET" : "NOT_SET"}`)

    const errors = await dispatchEvent(
      { event_type: event.event_type, payload: enrichedPayload },
      eligible,
      { name: store.name, currency: store.currency, language: store.language }
    )

    debug.push(`dispatch_errors: ${errors.length > 0 ? errors.join("; ") : "none"}`)

    const finalStatus = errors.length > 0 ? "failed" : "completed"
    await supabase
      .from("integration_events")
      .update({
        status: finalStatus,
        error: errors.length > 0 ? errors.join("; ") : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", event.id)

    debug.push(`RESULT: ${finalStatus}`)
    console.log("[WEBHOOK] Debug:", debug)

    return NextResponse.json({
      ok: true,
      dispatched: eligible.length,
      errors,
      debug,
    })
  } catch (err) {
    debug.push(`UNCAUGHT: ${err instanceof Error ? err.message : String(err)}`)
    console.error("[WEBHOOK] Uncaught error:", err, "debug:", debug)
    return NextResponse.json(
      { error: "Internal server error", debug },
      { status: 500 }
    )
  }
}
