import { createHash } from "crypto"
import { MetaIcon } from "@/components/icons/meta"
import type { AppDefinition } from "@/lib/integrations/registry"
import { COUNTRIES } from "@/lib/constants"

export const metaCapiApp: AppDefinition = {
  id: "meta-capi",
  name: "Meta Conversions API",
  description: "Send server-side Purchase events to Facebook for accurate ad conversion tracking.",
  icon: MetaIcon,
  iconColor: "#0081FB",
  category: "analytics",
  events: ["order.created"],
  hasCustomSetup: true,
}

interface MetaCapiConfig {
  pixel_id: string
  access_token: string
  test_event_code?: string
  test_mode?: boolean
}

interface OrderItem {
  product_name: string
  product_price: number
  quantity: number
  variant_options?: Record<string, string> | null
}

interface EventPayload {
  order_id?: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_country?: string
  customer_city?: string
  total: number
  discount_id?: string | null
  discount_amount?: number
  ip_address?: string | null
  items?: OrderItem[]
  [key: string]: unknown
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.code.toLowerCase()])
)

function hashSHA256(value: string): string {
  return createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex")
}

function resolveCountryISO(country: string): string | undefined {
  const lower = country.toLowerCase()
  if (lower.length === 2) return lower
  return COUNTRY_NAME_TO_CODE[lower]
}

function normalizePhoneForHash(phone: string): string {
  return phone.replace(/[^0-9]/g, "")
}

export async function handleMetaCAPI(
  eventType: string,
  payload: EventPayload,
  config: MetaCapiConfig,
  storeName: string,
  currency: string,
): Promise<void> {
  if (!config.pixel_id || !config.access_token) return
  if (eventType !== "order.created") return

  const nameParts = payload.customer_name.trim().split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  const userData: Record<string, string[]> = {}

  if (payload.customer_phone) {
    userData.ph = [hashSHA256(normalizePhoneForHash(payload.customer_phone))]
  }
  if (firstName) {
    userData.fn = [hashSHA256(firstName)]
  }
  if (lastName) {
    userData.ln = [hashSHA256(lastName)]
  }
  if (payload.customer_city) {
    userData.ct = [hashSHA256(payload.customer_city)]
  }
  if (payload.customer_country) {
    const iso = resolveCountryISO(payload.customer_country)
    if (iso) {
      userData.country = [hashSHA256(iso)]
    }
  }

  const contents = payload.items?.map((item) => ({
    id: item.product_name,
    quantity: item.quantity,
    item_price: item.product_price,
  })) || []

  const eventData: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: payload.total,
      currency: currency.toUpperCase(),
      content_type: "product",
      order_id: String(payload.order_number),
      contents,
    },
  }

  const body: Record<string, unknown> = {
    data: [eventData],
  }

  if (config.test_mode && config.test_event_code) {
    body.test_event_code = config.test_event_code
  }

  const url = `https://graph.facebook.com/v21.0/${config.pixel_id}/events?access_token=${config.access_token}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Meta CAPI error ${res.status}: ${text}`)
  }
}
