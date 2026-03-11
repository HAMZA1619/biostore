import { createAdminClient } from "@/lib/supabase/admin"
import { dispatchSingle } from "@/lib/integrations/handlers"
import { APPS } from "@/lib/integrations/registry"
import {
  normalizePhone,
} from "@/lib/integrations/apps/whatsapp"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const secret = process.env.INTEGRATION_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const event = body.record

    if (event && typeof event.payload === "string") {
      try { event.payload = JSON.parse(event.payload) } catch {}
    }

    if (!event?.id || !event?.store_id || !event?.event_type) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const isTriggerRow = !event.integration_id || event.integration_id === "_trigger"

    // Retried events have a real integration_id and status 'pending' (re-inserted by pg_cron)
    if (!isTriggerRow && event.status === "pending") {
      const retryCount = event.retry_count || 0

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

      const { data: integrationRow } = await supabase
        .from("store_integrations")
        .select("integration_id, config")
        .eq("store_id", event.store_id)
        .eq("integration_id", event.integration_id)
        .single()

      if (!integrationRow) {
        await supabase
          .from("integration_events")
          .update({ status: "failed", error: "Integration not found", processed_at: new Date().toISOString() })
          .eq("id", event.id)
        return NextResponse.json({ ok: true, skipped: true })
      }

      await supabase
        .from("integration_events")
        .update({ status: "processing" })
        .eq("id", event.id)

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

      try {
        const dispatchResult = await dispatchSingle(
          { event_type: event.event_type, payload: enrichedPayload },
          integrationRow,
          { id: store.id, name: store.name, currency: store.currency, language: store.language },
        )

        await supabase
          .from("integration_events")
          .update({ status: "completed", processed_at: new Date().toISOString() })
          .eq("id", event.id)

        if (dispatchResult.confirmationSent) {
          try {
            const normalizedPhone = normalizePhone(
              enrichedPayload.customer_phone as string,
              enrichedPayload.customer_country as string | undefined,
            )
            await supabase.from("order_confirmations").insert({
              order_id: enrichedPayload.order_id,
              store_id: event.store_id,
              customer_phone: normalizedPhone,
              status: "pending",
              sent_at: new Date().toISOString(),
            })
          } catch (confirmErr) {
            console.error("COD confirmation record error:", confirmErr)
          }
        }

        return NextResponse.json({ ok: true, retried: true, status: "completed" })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        await supabase
          .from("integration_events")
          .update({
            status: "failed",
            error: errorMsg,
            processed_at: new Date().toISOString(),
            retry_count: retryCount + 1,
          })
          .eq("id", event.id)
        return NextResponse.json({ ok: true, retried: true, status: "failed", error: errorMsg })
      }
    }

    // Only process trigger rows (integration_id is null or '_trigger', status pending)
    if (!isTriggerRow || event.status !== "pending") {
      return NextResponse.json({ ok: true, skipped: true })
    }

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
            retry_count: 0,
          })
          .select("id")
          .single()

        const appEventId = appEvent?.id

        try {
          const dispatchResult = await dispatchSingle(
            { event_type: event.event_type, payload: enrichedPayload },
            integration,
            { id: store.id, name: store.name, currency: store.currency, language: store.language },
          )

          if (appEventId) {
            await supabase
              .from("integration_events")
              .update({ status: "completed", processed_at: new Date().toISOString() })
              .eq("id", appEventId)
          }

          // COD confirmation was sent with the order message
          if (dispatchResult.confirmationSent) {
            try {
              const normalizedPhone = normalizePhone(
                enrichedPayload.customer_phone as string,
                enrichedPayload.customer_country as string | undefined,
              )
              await supabase.from("order_confirmations").insert({
                order_id: enrichedPayload.order_id,
                store_id: event.store_id,
                customer_phone: normalizedPhone,
                status: "pending",
                sent_at: new Date().toISOString(),
              })
            } catch (confirmErr) {
              console.error("COD confirmation record error:", confirmErr)
            }
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
