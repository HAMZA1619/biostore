import { createClient } from "@supabase/supabase-js"
import { dispatchEvent } from "@/lib/integrations/handlers"
import { APPS } from "@/lib/integrations/registry"
import { NextResponse } from "next/server"

function createWebhookClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  console.log("[WEBHOOK] supabase url:", url)
  console.log("[WEBHOOK] service_role_key:", serviceKey ? `SET (${serviceKey.substring(0, 15)}...)` : "NOT_SET — USING ANON KEY (RLS WILL BLOCK)")

  // Use service role key to bypass RLS, fall back to anon key
  return createClient(url, serviceKey || anonKey)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[WEBHOOK] body keys:", Object.keys(body))

    const event = body.record

    if (event && typeof event.payload === "string") {
      try {
        event.payload = JSON.parse(event.payload)
      } catch {
        console.log("[WEBHOOK] payload parse failed")
      }
    }

    console.log("[WEBHOOK] event_type:", event?.event_type, "store_id:", event?.store_id, "id:", event?.id)

    if (!event?.id || !event?.store_id || !event?.event_type) {
      console.log("[WEBHOOK] REJECTED: missing required fields")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createWebhookClient()

    const { error: updateErr } = await supabase
      .from("integration_events")
      .update({ status: "processing" })
      .eq("id", event.id)
    console.log("[WEBHOOK] status->processing:", updateErr ? updateErr.message : "ok")

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, currency, language")
      .eq("id", event.store_id)
      .single()
    console.log("[WEBHOOK] store:", store ? store.name : "NOT_FOUND", storeError?.message || "")

    if (!store) {
      await supabase
        .from("integration_events")
        .update({ status: "failed", error: "Store not found", processed_at: new Date().toISOString() })
        .eq("id", event.id)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: allIntegrations, error: intError } = await supabase
      .from("store_integrations")
      .select("integration_id, is_enabled, config")
      .eq("store_id", event.store_id)

    console.log("[WEBHOOK] all integrations for store:", allIntegrations?.length || 0, "error:", intError?.message || "none")
    allIntegrations?.forEach((i) => {
      console.log("[WEBHOOK]   ->", i.integration_id, "is_enabled:", i.is_enabled, "config:", JSON.stringify(i.config).substring(0, 200))
    })

    const integrations = allIntegrations?.filter((i) => i.is_enabled) || []
    console.log("[WEBHOOK] enabled integrations:", integrations.length)

    if (integrations.length === 0) {
      await supabase
        .from("integration_events")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", event.id)
      console.log("[WEBHOOK] DONE: no enabled integrations")
      return NextResponse.json({ ok: true, dispatched: 0 })
    }

    const eligible = integrations.filter((i) => {
      const def = APPS[i.integration_id]
      const match = def && def.events.includes(event.event_type)
      console.log("[WEBHOOK]   filter", i.integration_id, "def:", !!def, "match:", match)
      return match
    })
    console.log("[WEBHOOK] eligible:", eligible.length)

    let enrichedPayload = event.payload || {}
    if (event.event_type === "order.created" && enrichedPayload.order_id) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, product_price, quantity, variant_options")
        .eq("order_id", enrichedPayload.order_id)
      if (items && items.length > 0) {
        enrichedPayload = { ...enrichedPayload, items }
      }
      console.log("[WEBHOOK] order items:", items?.length || 0)
    }

    console.log("[WEBHOOK] EVOLUTION_API_URL:", process.env.EVOLUTION_API_URL || "NOT_SET")
    console.log("[WEBHOOK] EVOLUTION_API_KEY:", process.env.EVOLUTION_API_KEY ? "SET" : "NOT_SET")
    console.log("[WEBHOOK] GROQ_API_KEY:", process.env.GROQ_API_KEY ? "SET" : "NOT_SET")

    console.log("[WEBHOOK] dispatching to", eligible.length, "integrations...")
    const errors = await dispatchEvent(
      { event_type: event.event_type, payload: enrichedPayload },
      eligible,
      { name: store.name, currency: store.currency, language: store.language }
    )

    console.log("[WEBHOOK] dispatch errors:", errors.length > 0 ? errors : "none")

    const finalStatus = errors.length > 0 ? "failed" : "completed"
    await supabase
      .from("integration_events")
      .update({
        status: finalStatus,
        error: errors.length > 0 ? errors.join("; ") : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", event.id)

    console.log("[WEBHOOK] DONE:", finalStatus)

    return NextResponse.json({ ok: true, dispatched: eligible.length, errors })
  } catch (err) {
    console.error("[WEBHOOK] UNCAUGHT:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
