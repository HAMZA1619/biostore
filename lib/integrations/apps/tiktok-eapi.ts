import { createHash } from "crypto"
import { TiktokIcon } from "@/components/icons/tiktok"
import type { AppDefinition } from "@/lib/integrations/registry"
import { COUNTRIES } from "@/lib/constants"

export const tiktokEapiApp: AppDefinition = {
  id: "tiktok-eapi",
  name: "TikTok Events API",
  description: "Send server-side CompletePayment events to TikTok for accurate ad conversion tracking.",
  icon: TiktokIcon,
  iconColor: "#000000",
  category: "analytics",
  events: ["order.created"],
  hasCustomSetup: true,
}

interface TiktokEapiConfig {
  pixel_code: string
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

export async function handleTiktokEAPI(
  eventType: string,
  payload: EventPayload,
  config: TiktokEapiConfig,
  storeName: string,
  currency: string,
): Promise<void> {
  if (!config.pixel_code || !config.access_token) return
  if (eventType !== "order.created") return

  const nameParts = payload.customer_name.trim().split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  const userData: Record<string, string> = {}

  if (payload.customer_phone) {
    const normalizedPhone = normalizePhoneForHash(payload.customer_phone)
    userData.phone = hashSHA256(normalizedPhone)
    userData.external_id = hashSHA256(normalizedPhone)
  }
  if (firstName) {
    userData.first_name = hashSHA256(firstName)
  }
  if (lastName) {
    userData.last_name = hashSHA256(lastName)
  }
  if (payload.customer_city) {
    userData.city = hashSHA256(payload.customer_city)
  }
  if (payload.customer_country) {
    const iso = resolveCountryISO(payload.customer_country)
    if (iso) {
      userData.country = hashSHA256(iso)
    }
  }
  if (payload.ip_address) {
    userData.ip = payload.ip_address
  }

  const items = payload.items || []
  const contents = items.map((item) => ({
    content_id: item.product_name,
    content_name: item.product_name,
    quantity: item.quantity,
    price: item.product_price,
  }))

  const eventData: Record<string, unknown> = {
    event: "CompletePayment",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `order-${payload.order_number}-${Date.now()}`,
    user: userData,
    properties: {
      value: payload.total,
      currency: currency.toUpperCase(),
      content_type: "product",
      order_id: String(payload.order_number),
      contents,
    },
  }

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: config.pixel_code,
    data: [eventData],
  }

  if (config.test_mode && config.test_event_code) {
    body.test_event_code = config.test_event_code
  }

  const res = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/event/track/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": config.access_token,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`TikTok EAPI error ${res.status}: ${text}`)
  }
}
