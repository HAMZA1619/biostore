import { MessageSquare } from "lucide-react"
import type { AppDefinition } from "@/lib/integrations/registry"
import { COUNTRIES } from "@/lib/constants"

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
  customer_country?: string
  customer_city?: string
  customer_address?: string
  total: number
  status?: string
  old_status?: string
  new_status?: string
  items?: OrderItem[]
  [key: string]: unknown
}

const COUNTRY_DIAL_CODES: Record<string, string> = {
  MA: "212", DZ: "213", TN: "216", EG: "20", SA: "966", AE: "971",
  US: "1", GB: "44", FR: "33", DE: "49", ES: "34", IT: "39",
  TR: "90", IN: "91", PK: "92", BD: "880", NG: "234", KE: "254",
  ZA: "27", BR: "55", MX: "52", CA: "1", AU: "61", JP: "81",
  CN: "86", KR: "82", ID: "62", PH: "63", TH: "66", VN: "84",
  RU: "7", PL: "48", NL: "31", BE: "32", SE: "46", NO: "47",
  DK: "45", FI: "358", PT: "351", GR: "30", CZ: "420", RO: "40",
  HU: "36", AT: "43", CH: "41", IE: "353", IL: "972", JO: "962",
  LB: "961", IQ: "964", KW: "965", QA: "974", BH: "973", OM: "968",
  LY: "218", SD: "249", ET: "251", GH: "233", CI: "225", SN: "221",
  CM: "237", MR: "222", ML: "223",
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.code])
)

function resolveCountryCode(country: string): string | undefined {
  const upper = country.toUpperCase()
  if (COUNTRY_DIAL_CODES[upper]) return upper
  return COUNTRY_NAME_TO_CODE[country.toLowerCase()]
}

function normalizePhone(phone: string, country?: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, "")

  if (cleaned.startsWith("+")) {
    return cleaned.replace("+", "")
  }

  if (cleaned.startsWith("0") && country) {
    const code = resolveCountryCode(country)
    const dialCode = code ? COUNTRY_DIAL_CODES[code] : undefined
    if (dialCode) {
      return dialCode + cleaned.substring(1)
    }
  }

  if (cleaned.startsWith("00")) {
    return cleaned.substring(2)
  }

  return cleaned
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

    const addressParts = [
      payload.customer_address ? `Address: ${payload.customer_address}` : null,
      payload.customer_city ? `City: ${payload.customer_city}` : null,
      payload.customer_country ? `Country: ${payload.customer_country}` : null,
    ].filter(Boolean).join("\n")

    context = `Event: New order placed
Store: ${storeName}
Order #${payload.order_number}
Customer: ${payload.customer_name}
${addressParts || "Address: Not provided"}
Total: ${payload.total} ${currency}
Items ordered:
${itemsList}`
  } else if (eventType === "order.status_changed") {
    const addressParts = [
      payload.customer_address ? `Address: ${payload.customer_address}` : null,
      payload.customer_city ? `City: ${payload.customer_city}` : null,
      payload.customer_country ? `Country: ${payload.customer_country}` : null,
    ].filter(Boolean).join("\n")

    context = `Event: Order status updated
Store: ${storeName}
Order #${payload.order_number}
Customer: ${payload.customer_name}
${addressParts || "Address: Not provided"}
Previous status: ${payload.old_status}
New status: ${payload.new_status}`
  } else {
    return null
  }

  const systemPrompts: Record<string, string> = {
    "order.created": `You are a WhatsApp notification assistant. Generate a warm, friendly WhatsApp message in ${langName} to confirm a customer's new order.

CRITICAL — ONLY translate the static text (greetings, labels, closing). NEVER translate or change any of these dynamic values:
- Customer name: "${payload.customer_name}" — use EXACTLY as-is (first word only).
- Store name: "${storeName}" — use EXACTLY as-is. Do NOT add words like "store" or "متجر" before it.
- Product names: use EXACTLY as provided in the items list.
- Address: use EXACTLY as provided. Do NOT translate or reformat it.
- Numbers, prices, currency codes: keep as-is.

Rules:
- Write ONLY the static/surrounding text in ${langName}. All dynamic data stays in its original form.
- Use WhatsApp formatting: *bold* for store name, order number, and total.
- Structure (use blank lines between each section):
  1. Greet using the customer's name exactly as given above.
  2. Blank line.
  3. Order number.
  4. Blank line.
  5. Each item on its own line with quantity and price.
  6. Blank line.
  7. Total.
  8. Blank line.
  9. Delivery details: address and country (include city only if provided).
  10. Blank line.
  11. A short closing.
- Keep it concise — sound like a real person, not a robot.
- Vary your wording naturally each time.
- Do NOT include links, emojis, or placeholder text.
- Do NOT start with "Dear" — be casual and direct.
- Output ONLY the message text.`,

    "order.status_changed": `You are a WhatsApp notification assistant. Generate a short, friendly WhatsApp message in ${langName} to update a customer on their order status.

CRITICAL — ONLY translate the static text (greetings, labels, closing). NEVER translate or change any of these dynamic values:
- Customer name: "${payload.customer_name}" — use EXACTLY as-is (first word only).
- Store name: "${storeName}" — use EXACTLY as-is. Do NOT add words like "store" or "متجر" before it.
- Numbers, prices, currency codes: keep as-is.

Rules:
- Write ONLY the static/surrounding text in ${langName}. All dynamic data stays in its original form.
- Use WhatsApp formatting: *bold* for store name, order number, and new status.
- Structure:
  1. Greet using the customer's name exactly as given above.
  2. Inform them their order status changed.
  3. Show: Order #, old status → new status.
  4. A short encouraging line based on the new status.
- Keep it to 3-5 lines. Short and clear.
- Vary your wording naturally each time.
- Do NOT include links, emojis, or placeholder text.
- Do NOT start with "Dear" — be casual and direct.
- Output ONLY the message text.`,
  }

  const systemPrompt = systemPrompts[eventType]
  if (!systemPrompt) return null

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
            { role: "system", content: systemPrompt },
            { role: "user", content: context },
          ],
          max_tokens: 400,
          temperature: 0.9,
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
  const firstName = payload.customer_name.split(" ")[0]

  if (eventType === "order.created") {
    const itemsBlock = payload.items?.length
      ? payload.items
          .map(
            (i) =>
              `  ${i.product_name}${i.variant_options ? ` (${Object.values(i.variant_options).join(", ")})` : ""} x${i.quantity} — ${i.product_price} ${currency}`
          )
          .join("\n")
      : null

    const addressLine = [payload.customer_address, payload.customer_city, payload.customer_country].filter(Boolean).join(", ")

    const lines = [
      `Hey ${firstName}! Your order from *${storeName}* has been received.`,
      ``,
      `*Order #${payload.order_number}*`,
      ``,
    ]

    if (itemsBlock) {
      lines.push(itemsBlock, ``)
    }

    lines.push(`*Total: ${payload.total} ${currency}*`)

    if (addressLine) {
      lines.push(``, `Delivery: ${addressLine}`)
    }

    lines.push(``, `We're on it! You'll hear from us when there's an update.`)

    return lines.join("\n")
  }

  if (eventType === "order.status_changed") {
    return [
      `Hey ${firstName}! Quick update on your order from *${storeName}*:`,
      ``,
      `*Order #${payload.order_number}*`,
      `Status: ${payload.old_status} → *${payload.new_status}*`,
      ``,
      `Thanks for your patience!`,
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

  const phone = normalizePhone(payload.customer_phone, payload.customer_country)

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
