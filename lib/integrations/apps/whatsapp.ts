import { MessageSquare } from "lucide-react"
import type { AppDefinition } from "@/lib/integrations/registry"

export const whatsappApp: AppDefinition = {
  id: "whatsapp",
  name: "WhatsApp",
  description: "Send order confirmations to customers via WhatsApp when orders are placed.",
  icon: MessageSquare,
  category: "notifications",
  events: ["order.created", "order.status_changed"],
  hasCustomSetup: true,
}

interface WhatsAppConfig {
  instance_name: string
  connected: boolean
}

interface OrderItem {
  product_name: string
  product_price: number
  quantity: number
  variant_options?: Record<string, string> | null
}

interface EventPayload {
  order_number: number
  customer_name: string
  customer_phone: string
  total: number
  status?: string
  old_status?: string
  new_status?: string
  items?: OrderItem[]
  [key: string]: unknown
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
}

async function generateAIMessage(
  eventType: string,
  payload: EventPayload,
  storeName: string,
  currency: string,
  language: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const langName = LANGUAGE_NAMES[language] || "English"

  let context: string
  if (eventType === "order.created") {
    const itemsList = payload.items?.length
      ? payload.items
          .map(
            (i) =>
              `- ${i.product_name}${i.variant_options ? ` (${Object.values(i.variant_options).join(", ")})` : ""} x${i.quantity} — ${i.product_price} ${currency}`
          )
          .join("\n")
      : "Items not available"

    context = `Event: New order placed
Store: ${storeName}
Order #${payload.order_number}
Customer: ${payload.customer_name}
Total: ${payload.total} ${currency}
Items ordered:
${itemsList}`
  } else if (eventType === "order.status_changed") {
    context = `Event: Order status updated
Store: ${storeName}
Order #${payload.order_number}
Customer: ${payload.customer_name}
Previous status: ${payload.old_status}
New status: ${payload.new_status}`
  } else {
    return null
  }

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
              content: `You are a WhatsApp notification assistant for an e-commerce store. Generate a friendly, concise WhatsApp message to send to the customer about their order.

Rules:
- Write the ENTIRE message in ${langName}.
- Use WhatsApp formatting: *bold* for emphasis, _italic_ for subtle text.
- Keep it short (4-8 lines max).
- Include the order number, items ordered (if available), and total.
- Be warm and professional — thank the customer.
- Do NOT include any links, emojis, or placeholder text.
- Do NOT include greetings like "Dear customer" — use their first name.
- Output ONLY the message text, nothing else.`,
            },
            { role: "user", content: context },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    return null
  }
}

export function buildWhatsAppMessage(
  eventType: string,
  payload: EventPayload,
  storeName: string,
  currency: string
): string {
  if (eventType === "order.created") {
    return [
      `*New Order #${payload.order_number}* on ${storeName}`,
      `Customer: ${payload.customer_name}`,
      `Phone: ${payload.customer_phone}`,
      `Total: ${payload.total} ${currency}`,
      `Status: Pending`,
    ].join("\n")
  }

  if (eventType === "order.status_changed") {
    return [
      `*Order #${payload.order_number}* status updated`,
      `${payload.old_status} → ${payload.new_status}`,
      `Customer: ${payload.customer_name}`,
    ].join("\n")
  }

  return ""
}

export async function handleWhatsApp(
  eventType: string,
  payload: EventPayload,
  config: WhatsAppConfig,
  storeName: string,
  currency: string,
  storeLanguage?: string
): Promise<void> {
  if (!config.connected || !config.instance_name) return

  const message =
    (await generateAIMessage(eventType, payload, storeName, currency, storeLanguage || "en")) ||
    buildWhatsAppMessage(eventType, payload, storeName, currency)
  if (!message) return

  const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "")
  const evolutionKey = process.env.EVOLUTION_API_KEY
  if (!evolutionUrl || !evolutionKey) {
    throw new Error("Evolution API not configured")
  }

  const phone = payload.customer_phone.replace(/[^0-9+]/g, "")

  const res = await fetch(
    `${evolutionUrl}/message/sendText/${config.instance_name}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
      signal: AbortSignal.timeout(15000),
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`WhatsApp API error ${res.status}: ${body}`)
  }
}
