import urlJoin from "url-join"
import { createAdminClient } from "@/lib/supabase/admin"
import { dispatchSingle } from "@/lib/integrations/handlers"
import { APPS } from "@/lib/integrations/registry"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  try {
    // Expire old checkouts (> 48h)
    await supabase
      .from("abandoned_checkouts")
      .update({ status: "expired" })
      .in("status", ["pending", "sent"])
      .lt("created_at", fortyEightHoursAgo)

    // Fetch pending checkouts that are at least 30 min old but less than 24h
    const { data: checkouts } = await supabase
      .from("abandoned_checkouts")
      .select("*, stores!inner(id, name, slug, currency, language, custom_domain, domain_verified)")
      .eq("status", "pending")
      .lt("updated_at", thirtyMinAgo)
      .gt("created_at", twentyFourHoursAgo)
      .limit(50)

    if (!checkouts || checkouts.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    let processed = 0

    for (const checkout of checkouts) {
      const store = checkout.stores as unknown as {
        id: string
        name: string
        slug: string
        currency: string
        language: string
        custom_domain: string | null
        domain_verified: boolean
      }

      // Check if customer placed an order since the checkout was created
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("customer_phone", checkout.customer_phone)
        .gt("created_at", checkout.created_at)

      if (count && count > 0) {
        await supabase
          .from("abandoned_checkouts")
          .update({ status: "recovered", recovered_at: new Date().toISOString() })
          .eq("id", checkout.id)
        continue
      }

      // Build recovery URL
      const baseStoreUrl =
        store.custom_domain && store.domain_verified
          ? `https://${store.custom_domain}`
          : urlJoin(process.env.NEXT_PUBLIC_APP_URL!, store.slug)
      const recoveryUrl = urlJoin(baseStoreUrl, "cart") + `?checkout=${checkout.id}`

      // Build payload compatible with integration handlers
      const items = (checkout.cart_items as { product_name: string; product_price: number; quantity: number; variant_options?: Record<string, string> | null }[]) || []
      const total = items.reduce((sum, i) => sum + i.product_price * i.quantity, 0)

      const payload = {
        order_number: 0,
        customer_name: checkout.customer_name || "",
        customer_phone: checkout.customer_phone,
        customer_address: "",
        items,
        total,
        currency: checkout.currency,
        event_type: "Abandoned Checkout",
        checkout_status: "Pending Recovery",
        store_name: store.name,
        store_url: recoveryUrl,
        abandoned_checkout_id: checkout.id,
      }

      // Get eligible integrations for this store
      const { data: integrations } = await supabase
        .from("store_integrations")
        .select("integration_id, config")
        .eq("store_id", store.id)

      const eligible = (integrations || []).filter((i) => {
        const def = APPS[i.integration_id]
        return def && def.events.includes("checkout.abandoned")
      })

      if (eligible.length > 0) {
        await Promise.allSettled(
          eligible.map(async (integration) => {
            const { data: appEvent } = await supabase
              .from("integration_events")
              .insert({
                store_id: store.id,
                integration_id: integration.integration_id,
                event_type: "checkout.abandoned",
                payload,
                status: "processing",
              })
              .select("id")
              .single()

            const appEventId = appEvent?.id

            try {
              await dispatchSingle(
                { event_type: "checkout.abandoned", payload: payload as unknown as Record<string, unknown> },
                integration as { integration_id: string; config: Record<string, unknown> },
                { id: store.id, name: store.name, currency: store.currency, language: store.language },
              )

              if (appEventId) {
                await supabase
                  .from("integration_events")
                  .update({ status: "completed", processed_at: new Date().toISOString() })
                  .eq("id", appEventId)
              }
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : "Unknown error"
              if (appEventId) {
                await supabase
                  .from("integration_events")
                  .update({ status: "failed", error: errorMsg, processed_at: new Date().toISOString() })
                  .eq("id", appEventId)
              }
            }
          })
        )
      }

      // Mark as sent
      await supabase
        .from("abandoned_checkouts")
        .update({ status: "sent" })
        .eq("id", checkout.id)

      processed++
    }

    return NextResponse.json({ ok: true, processed })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
