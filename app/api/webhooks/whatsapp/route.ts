import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import urlJoin from "url-join"

const LANG_NAMES: Record<string, string> = {
  en: "English", fr: "French", "fr-CA": "Canadian French", "fr-MA": "Moroccan French",
  ar: "Modern Standard Arabic (العربية الفصحى) written in Arabic script", "ar-EG": "Egyptian Arabic (مصري) written in Arabic script", "ar-MA": "Moroccan Darija (الدارجة المغربية) written in Arabic script",
  "ar-SA": "Gulf Arabic (خليجي) written in Arabic script", "ar-LB": "Lebanese/Levantine Arabic (لبناني) written in Arabic script", "ar-DZ": "Algerian Arabic (جزائري) written in Arabic script", "ar-TN": "Tunisian Arabic (تونسي) written in Arabic script",
  es: "Spanish", "es-MX": "Mexican Spanish", "es-AR": "Argentine Spanish",
  pt: "Portuguese", "pt-BR": "Brazilian Portuguese",
  de: "German", it: "Italian", nl: "Dutch", tr: "Turkish", ru: "Russian",
  zh: "Simplified Chinese", "zh-TW": "Traditional Chinese",
  ja: "Japanese", ko: "Korean", hi: "Hindi", id: "Indonesian",
  ms: "Malay", pl: "Polish", sv: "Swedish", th: "Thai", vi: "Vietnamese",
}

const FALLBACK_CLARIFICATION = "Sorry, I didn't understand. Could you reply with *yes* to confirm or *no* to cancel?"

async function generateClarificationMessage(customerText: string, language: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY_WHATSAPP
  if (!apiKey) return FALLBACK_CLARIFICATION

  const langName = LANG_NAMES[language] || "English"
  const isArabicDialect = language.startsWith("ar")
  const clarityRule = isArabicDialect
    ? "Write naturally like a real person texting on WhatsApp in this dialect. Use simple everyday words that native speakers actually use. Every sentence must be clear and easy to understand."
    : "Write naturally like a real person texting on WhatsApp. Use simple, clear language."

  async function callGroq(): Promise<string | null> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Write a short WhatsApp message in ${langName}. Every word MUST be in ${langName}. ${clarityRule} The customer sent an unclear reply to an order confirmation. Ask them to reply yes to confirm or no to cancel. 1-2 sentences, casual, no emojis, no "Dear", no bold/asterisks. Output ONLY the message.`,
          },
          { role: "user", content: `Customer replied: "${customerText}"` },
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  }

  try {
    const result = await callGroq()
    if (result) return result
    return (await callGroq()) || FALLBACK_CLARIFICATION
  } catch {
    try {
      return (await callGroq()) || FALLBACK_CLARIFICATION
    } catch {
      return FALLBACK_CLARIFICATION
    }
  }
}

async function sendWhatsAppText(instanceName: string, phone: string, text: string): Promise<void> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  if (!evolutionUrl || !evolutionKey) return

  await fetch(urlJoin(evolutionUrl, "message/sendText", instanceName), {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: evolutionKey },
    body: JSON.stringify({ number: phone, text }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => {})
}

async function classifyResponse(text: string): Promise<"confirm" | "cancel" | "unknown" | null> {
  const apiKey = process.env.GROQ_API_KEY_WHATSAPP
  if (!apiKey) return null

  async function callGroq(): Promise<"confirm" | "cancel" | "unknown" | null> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Classify this customer reply to an order confirmation. They were asked to confirm or cancel. Output EXACTLY one word: "confirm" if positive, "cancel" if negative, "unknown" if unclear. The customer may reply in any language. No explanation.`,
          },
          { role: "user", content: text },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const result = data.choices?.[0]?.message?.content?.trim().toLowerCase()

    if (result === "confirm") return "confirm"
    if (result === "cancel") return "cancel"
    if (result === "unknown") return "unknown"
    return null
  }

  try {
    const result = await callGroq()
    if (result) return result
    return await callGroq()
  } catch {
    try {
      return await callGroq()
    } catch {
      return null
    }
  }
}

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

    const supabase = createAdminClient()

    // Text fallback: use AI to classify response as confirm/cancel
    if (!action) {
      const text = (
        (body?.data?.message?.conversation as string) ||
        (body?.data?.message?.extendedTextMessage?.text as string) ||
        ""
      ).trim()

      if (text) {
        const result = await classifyResponse(text)

        if (result === "unknown") {
          // Check if this phone has a pending confirmation before asking to clarify
          const { data: pending } = await supabase
            .from("order_confirmations")
            .select("store_id")
            .eq("status", "pending")
            .eq("customer_phone", phone)
            .limit(1)
            .single()

          if (pending) {
            const { data: integration } = await supabase
              .from("store_integrations")
              .select("config")
              .eq("store_id", pending.store_id)
              .eq("integration_id", "whatsapp")
              .single()

            const config = (integration?.config || {}) as Record<string, unknown>
            const instanceName = config.instance_name as string | undefined
            const messageLang = config.message_language as string | undefined
            const { data: store } = await supabase
              .from("stores")
              .select("language")
              .eq("id", pending.store_id)
              .single()

            if (instanceName) {
              const clarification = await generateClarificationMessage(text, messageLang || store?.language || "en")
              await sendWhatsAppText(instanceName, phone, clarification)
            }
          }

          return NextResponse.json({ ok: true, clarification: true })
        }

        action = result === "confirm" || result === "cancel" ? result : null
      }
    }

    if (!action) {
      return NextResponse.json({ ok: true })
    }

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
