import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")
    if (!secret || secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Skip messages sent by us
    if (body?.data?.key?.fromMe) {
      return NextResponse.json({ ok: true })
    }

    const remoteJid = body?.data?.key?.remoteJid as string | undefined
    if (!remoteJid || !remoteJid.endsWith("@s.whatsapp.net")) {
      return NextResponse.json({ ok: true })
    }

    const phone = remoteJid.replace("@s.whatsapp.net", "")

    // Try to extract action from button response
    let action: "confirm" | "cancel" | null = null
    let orderId: string | null = null

    const buttonId =
      body?.data?.message?.buttonsResponseMessage?.selectedButtonId as string | undefined
    if (buttonId) {
      if (buttonId.startsWith("confirm_")) {
        action = "confirm"
        orderId = buttonId.replace("confirm_", "")
      } else if (buttonId.startsWith("cancel_")) {
        action = "cancel"
        orderId = buttonId.replace("cancel_", "")
      }
    }

    // Text fallback: parse plain text replies
    if (!action) {
      const text = (
        (body?.data?.message?.conversation as string) ||
        (body?.data?.message?.extendedTextMessage?.text as string) ||
        ""
      )
        .toLowerCase()
        .trim()

      if (["1", "confirm", "yes", "oui", "نعم"].includes(text)) {
        action = "confirm"
      } else if (["2", "cancel", "no", "non", "لا"].includes(text)) {
        action = "cancel"
      }
    }

    if (!action) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    // Find pending confirmation for this phone (+ exact order if from button)
    let query = supabase
      .from("order_confirmations")
      .select("id, order_id")
      .eq("status", "pending")
      .eq("customer_phone", phone)

    if (orderId) {
      query = query.eq("order_id", orderId)
    }

    const { data: confirmation } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!confirmation) {
      return NextResponse.json({ ok: true })
    }

    const newConfirmationStatus = action === "confirm" ? "confirmed" : "canceled"
    const newOrderStatus = action === "confirm" ? "confirmed" : "canceled"
    const now = new Date().toISOString()

    // Update confirmation record
    await supabase
      .from("order_confirmations")
      .update({ status: newConfirmationStatus, responded_at: now })
      .eq("id", confirmation.id)
      .eq("status", "pending")

    // Update order status (only if still pending)
    await supabase
      .from("orders")
      .update({ status: newOrderStatus, updated_at: now })
      .eq("id", confirmation.order_id)
      .eq("status", "pending")

    return NextResponse.json({ ok: true, action: newConfirmationStatus })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
