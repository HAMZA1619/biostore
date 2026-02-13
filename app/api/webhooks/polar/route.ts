import { createAdminClient } from "@/lib/supabase/admin"
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks"
import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

async function revalidateOwnerStore(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: store } = await supabase
    .from("stores")
    .select("id, slug")
    .eq("owner_id", userId)
    .single()
  if (store) {
    revalidateTag(`store:${store.slug}`, "max")
    revalidateTag(`store:${store.id}`, "max")
  }
}

export async function POST(request: Request) {
  try {
    const secret = process.env.POLAR_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 }
      )
    }

    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    let event: { type: string; data: Record<string, unknown> }
    try {
      event = validateEvent(body, headers, secret) as typeof event
    } catch (e) {
      if (e instanceof WebhookVerificationError) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      throw e
    }

    const supabase = createAdminClient()
    let ownerId: string | undefined

    switch (event.type) {
      case "subscription.active": {
        const subId = event.data?.id as string | undefined
        const customerId = event.data?.customerId as string | undefined
        const meta = event.data?.metadata as Record<string, string> | undefined
        const userId = meta?.user_id
        if (!subId) break

        const update = {
          subscription_status: "active",
          subscription_tier: "pro",
          polar_subscription_id: subId,
          ...(customerId ? { polar_customer_id: customerId } : {}),
        }

        if (userId) {
          await supabase.from("profiles").update(update).eq("id", userId)
          ownerId = userId
        } else if (customerId) {
          const { data } = await supabase.from("profiles").update(update).eq("polar_customer_id", customerId).select("id").single()
          ownerId = data?.id
        }
        break
      }

      case "subscription.canceled": {
        const subId = event.data?.id as string | undefined
        if (!subId) break

        const { data } = await supabase
          .from("profiles")
          .update({ subscription_status: "canceled" })
          .eq("polar_subscription_id", subId)
          .select("id")
          .single()
        ownerId = data?.id
        break
      }

      case "subscription.revoked": {
        const subId = event.data?.id as string | undefined
        if (!subId) break

        const { data } = await supabase
          .from("profiles")
          .update({
            subscription_status: "expired",
            subscription_tier: "free",
          })
          .eq("polar_subscription_id", subId)
          .select("id")
          .single()
        ownerId = data?.id
        break
      }

      case "subscription.past_due": {
        const subId = event.data?.id as string | undefined
        if (!subId) break

        const { data } = await supabase
          .from("profiles")
          .update({
            subscription_status: "past_due",
          })
          .eq("polar_subscription_id", subId)
          .select("id")
          .single()
        ownerId = data?.id
        break
      }
    }

    if (ownerId) {
      await revalidateOwnerStore(supabase, ownerId)
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
