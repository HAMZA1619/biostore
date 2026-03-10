import urlJoin from "url-join"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import type { AppDefinition } from "@/lib/integrations/registry"
import { COUNTRIES } from "@/lib/constants"

export const whatsappApp: AppDefinition = {
  id: "whatsapp",
  name: "WhatsApp",
  description: "Send order confirmations to customers via WhatsApp when orders are placed.",
  icon: WhatsAppIcon,
  iconColor: "#25D366",
  category: "notifications",
  events: ["order.created", "order.status_changed", "checkout.abandoned"],
  hasCustomSetup: true,
}

export interface WhatsAppConfig {
  instance_name: string
  connected: boolean
  enabled_events?: string[]
  cod_confirmation_enabled?: boolean
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
  subtotal?: number
  discount_id?: string | null
  discount_amount?: number
  delivery_fee?: number
  currency?: string
  status?: string
  old_status?: string
  new_status?: string
  items?: OrderItem[]
  [key: string]: unknown
}

interface AbandonedCheckoutPayload {
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_country?: string
  customer_city?: string
  customer_address?: string
  cart_items: Array<{
    product_name: string
    product_price: number
    quantity: number
    variant_options?: string | null
  }>
  subtotal: number
  total: number
  currency: string
  store_name: string
  store_url: string
  abandoned_checkout_id: string
  status: string
  created_at: string
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

export function normalizePhone(phone: string, country?: string): string {
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

export interface WhatsAppLanguage {
  code: string
  name: string
}

export const WHATSAPP_LANGUAGES: WhatsAppLanguage[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "nl", name: "Nederlands" },
  { code: "tr", name: "Türkçe" },
  { code: "ru", name: "Русский" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "hi", name: "हिन्दी" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "pl", name: "Polski" },
  { code: "sv", name: "Svenska" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
]

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French", "fr-CA": "Canadian French", "fr-MA": "Moroccan French",
  ar: "Modern Standard Arabic (العربية الفصحى) written in Arabic script", "ar-EG": "Egyptian Arabic (مصري) written in Arabic script", "ar-MA": "Moroccan Darija (الدارجة المغربية) written in Arabic script",
  "ar-SA": "Gulf Arabic (خليجي) written in Arabic script", "ar-LB": "Lebanese/Levantine Arabic (لبناني) written in Arabic script", "ar-DZ": "Algerian Arabic (جزائري) written in Arabic script", "ar-TN": "Tunisian Arabic (تونسي) written in Arabic script",
  es: "Spanish", "es-MX": "Mexican Spanish", "es-AR": "Argentine Spanish",
  pt: "Portuguese", "pt-BR": "Brazilian Portuguese",
  de: "German", it: "Italian", nl: "Dutch", tr: "Turkish", ru: "Russian",
  zh: "Simplified Chinese", "zh-TW": "Traditional Chinese",
  ja: "Japanese", ko: "Korean", hi: "Hindi", id: "Indonesian",
  ms: "Malay", pl: "Polish", sv: "Swedish", th: "Thai", vi: "Vietnamese",
}

const STATUS_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", returned: "Returned", canceled: "Canceled" },
  fr: { pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", returned: "Retournée", canceled: "Annulée" },
  "fr-CA": { pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", returned: "Retournée", canceled: "Annulée" },
  "fr-MA": { pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", returned: "Retournée", canceled: "Annulée" },
  ar: { pending: "قيد الانتظار", confirmed: "مؤكدة", shipped: "تم الشحن", delivered: "تم التوصيل", returned: "مرتجعة", canceled: "ملغاة" },
  "ar-EG": { pending: "مستنية", confirmed: "متأكدة", shipped: "اتشحنت", delivered: "اتوصلت", returned: "مرتجعة", canceled: "ملغية" },
  "ar-MA": { pending: "كتسنا", confirmed: "متأكدة", shipped: "تصيفطات", delivered: "توصلات", returned: "رجعات", canceled: "تلغات" },
  "ar-SA": { pending: "معلقة", confirmed: "مأكدة", shipped: "تم الشحن", delivered: "توصلت", returned: "مرجعة", canceled: "ملغية" },
  "ar-LB": { pending: "بالانتظار", confirmed: "مأكدة", shipped: "انبعتت", delivered: "وصلت", returned: "رجعت", canceled: "ملغية" },
  "ar-DZ": { pending: "في الانتظار", confirmed: "متأكدة", shipped: "تبعثت", delivered: "توصلت", returned: "رجعت", canceled: "تلغات" },
  "ar-TN": { pending: "في الانتظار", confirmed: "متأكدة", shipped: "تبعثت", delivered: "توصلت", returned: "رجعت", canceled: "تلغات" },
  es: { pending: "Pendiente", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregado", returned: "Devuelto", canceled: "Cancelado" },
  "es-MX": { pending: "Pendiente", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregado", returned: "Devuelto", canceled: "Cancelado" },
  "es-AR": { pending: "Pendiente", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregado", returned: "Devuelto", canceled: "Cancelado" },
  pt: { pending: "Pendente", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregue", returned: "Devolvido", canceled: "Cancelado" },
  "pt-BR": { pending: "Pendente", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregue", returned: "Devolvido", canceled: "Cancelado" },
  de: { pending: "Ausstehend", confirmed: "Bestätigt", shipped: "Versendet", delivered: "Geliefert", returned: "Zurückgesendet", canceled: "Storniert" },
  it: { pending: "In attesa", confirmed: "Confermato", shipped: "Spedito", delivered: "Consegnato", returned: "Reso", canceled: "Annullato" },
  nl: { pending: "In afwachting", confirmed: "Bevestigd", shipped: "Verzonden", delivered: "Bezorgd", returned: "Geretourneerd", canceled: "Geannuleerd" },
  tr: { pending: "Beklemede", confirmed: "Onaylandı", shipped: "Kargoya verildi", delivered: "Teslim edildi", returned: "İade edildi", canceled: "İptal edildi" },
  ru: { pending: "В ожидании", confirmed: "Подтверждён", shipped: "Отправлен", delivered: "Доставлен", returned: "Возвращён", canceled: "Отменён" },
  zh: { pending: "待处理", confirmed: "已确认", shipped: "已发货", delivered: "已送达", returned: "已退货", canceled: "已取消" },
  "zh-TW": { pending: "待處理", confirmed: "已確認", shipped: "已出貨", delivered: "已送達", returned: "已退貨", canceled: "已取消" },
  ja: { pending: "保留中", confirmed: "確認済み", shipped: "発送済み", delivered: "配達完了", returned: "返品済み", canceled: "キャンセル済み" },
  ko: { pending: "대기 중", confirmed: "확인됨", shipped: "배송됨", delivered: "배달 완료", returned: "반품됨", canceled: "취소됨" },
  hi: { pending: "लंबित", confirmed: "पुष्टि हुई", shipped: "भेज दिया गया", delivered: "डिलीवर हो गया", returned: "वापस किया गया", canceled: "रद्द किया गया" },
  id: { pending: "Menunggu", confirmed: "Dikonfirmasi", shipped: "Dikirim", delivered: "Terkirim", returned: "Dikembalikan", canceled: "Dibatalkan" },
  ms: { pending: "Menunggu", confirmed: "Disahkan", shipped: "Dihantar", delivered: "Disampaikan", returned: "Dipulangkan", canceled: "Dibatalkan" },
  pl: { pending: "Oczekujące", confirmed: "Potwierdzone", shipped: "Wysłane", delivered: "Dostarczone", returned: "Zwrócone", canceled: "Anulowane" },
  sv: { pending: "Väntande", confirmed: "Bekräftad", shipped: "Skickad", delivered: "Levererad", returned: "Returnerad", canceled: "Avbruten" },
  th: { pending: "รอดำเนินการ", confirmed: "ยืนยันแล้ว", shipped: "จัดส่งแล้ว", delivered: "ส่งถึงแล้ว", returned: "ส่งคืนแล้ว", canceled: "ยกเลิกแล้ว" },
  vi: { pending: "Đang chờ", confirmed: "Đã xác nhận", shipped: "Đã gửi", delivered: "Đã giao", returned: "Đã trả lại", canceled: "Đã hủy" },
}

function translateStatus(status: string | undefined, language: string): string {
  if (!status) return ""
  return STATUS_TRANSLATIONS[language]?.[status] || STATUS_TRANSLATIONS.en?.[status] || status
}

async function generateAIMessage(
  eventType: string,
  payload: EventPayload,
  storeName: string,
  currency: string,
  language: string,
  codConfirmation?: boolean
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY_WHATSAPP
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

    const discountLine = payload.discount_amount && payload.discount_amount > 0
      ? `\nDiscount: -${payload.discount_amount} ${currency}`
      : ""
    const subtotalLine = payload.subtotal != null && payload.discount_amount && payload.discount_amount > 0
      ? `\nSubtotal: ${payload.subtotal} ${currency}`
      : ""
    const deliveryLine = payload.delivery_fee && payload.delivery_fee > 0
      ? `\nDelivery fee: ${payload.delivery_fee} ${currency}`
      : ""

    context = `Event: New order placed
Store: ${storeName}
Order #${payload.order_number}
Customer: ${payload.customer_name}
${addressParts || "Address: Not provided"}${subtotalLine}${discountLine}${deliveryLine}
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
Status: ${translateStatus(payload.new_status, language)}`
  } else if (eventType === "checkout.abandoned") {
    const aPayload = payload as unknown as AbandonedCheckoutPayload
    const itemsList = aPayload.cart_items?.length
      ? aPayload.cart_items
          .map(
            (i) =>
              `- ${i.product_name}${i.variant_options ? ` (${i.variant_options})` : ""} x${i.quantity} — ${i.product_price} ${currency}`
          )
          .join("\n")
      : "Items not available"

    context = `Event: Abandoned checkout recovery
Store: ${aPayload.store_name}
Customer: ${aPayload.customer_name}
Total: ${aPayload.total} ${currency}
Store URL: ${aPayload.store_url}

Items in cart:
${itemsList}`
  } else {
    return null
  }

  const isArabicDialect = language.startsWith("ar")
  const clarityRule = isArabicDialect
    ? `IMPORTANT: Write naturally like a real person texting on WhatsApp in this dialect. Use simple everyday words that native speakers actually use. Avoid formal/literary Arabic unless the dialect is "ar" (MSA). Every sentence must be clear and easy to understand.`
    : `IMPORTANT: Write naturally like a real person texting on WhatsApp. Use simple, clear language. Every sentence must be easy to understand.`

  const keepAsIs = `DO NOT translate these — copy exactly as-is:
- Customer name: "${payload.customer_name}" (use first word only)
- Store name: "${storeName}" (never prefix with "store"/"متجر"/"magasin" etc.)
- Product names, addresses, numbers, prices, currency codes

${clarityRule}`

  const systemPrompts: Record<string, string> = {
    "order.created": `Write a WhatsApp order confirmation. Language: ${langName}. Every word of your output MUST be in ${langName} except the dynamic values below.

${keepAsIs}

Separate sections with blank lines. Do NOT use any bold formatting or asterisks (*) around words.
Structure:
1. Casual greeting with first name
2. Order #number
3. Items list (name x qty — price currency, one per line)
4. ${payload.discount_amount && payload.discount_amount > 0 ? "Subtotal, discount line, " : ""}${payload.delivery_fee && payload.delivery_fee > 0 ? "delivery fee, " : ""}Total
5. Delivery address
6. ${codConfirmation ? "Natural question asking to confirm the order" : "Short friendly closing"}

No emojis. No links. No "Dear". No bold/asterisks. Output ONLY the message.`,

    "order.status_changed": `Write a WhatsApp order status update. Language: ${langName}. Every word MUST be in ${langName} except the dynamic values below.

${keepAsIs}

Do NOT use any bold formatting or asterisks (*) around words.
Structure (3-5 lines total):
1. Casual greeting with first name
2. Order # and its current status
3. One encouraging line matching the status

No emojis. No links. No "Dear". No bold/asterisks. Output ONLY the message.`,

    "checkout.abandoned": `Write a WhatsApp cart recovery message. Language: ${langName}. Every word MUST be in ${langName} except the dynamic values below.

${keepAsIs}
- Store URL: "${(payload as unknown as AbandonedCheckoutPayload).store_url}" (copy exactly)

Separate sections with blank lines. Do NOT use any bold formatting or asterisks (*) around words.
Structure:
1. Casual greeting with first name
2. Remind about items left at store name
3. Items list (name x qty — price currency, one per line)
4. Total
5. Store URL on its own line
6. Short friendly closing

No emojis. Not pushy. No "Dear". No bold/asterisks. Output ONLY the message.`,
  }

  const systemPrompt = systemPrompts[eventType]
  if (!systemPrompt) return null

  async function callGroq(): Promise<string | null> {
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
          max_tokens: 500,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  }

  // Try twice before giving up
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

export function buildWhatsAppMessage(
  eventType: string,
  payload: EventPayload,
  storeName: string,
  currency: string,
  language: string,
  codConfirmation?: boolean
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

    if (payload.discount_amount && payload.discount_amount > 0 && payload.subtotal != null) {
      lines.push(`Subtotal: ${payload.subtotal} ${currency}`)
      lines.push(`Discount: -${payload.discount_amount} ${currency}`)
    }
    if (payload.delivery_fee && payload.delivery_fee > 0) {
      lines.push(`Delivery fee: ${payload.delivery_fee} ${currency}`)
    }
    lines.push(`*Total: ${payload.total} ${currency}*`)

    if (addressLine) {
      lines.push(``, `Delivery: ${addressLine}`)
    }

    if (codConfirmation) {
      lines.push(``, `Can you confirm this order?`)
    } else {
      lines.push(``, `We're on it! You'll hear from us when there's an update.`)
    }

    return lines.join("\n")
  }

  if (eventType === "order.status_changed") {
    return [
      `Hey ${firstName}! Quick update on your order from *${storeName}*:`,
      ``,
      `*Order #${payload.order_number}*`,
      `Status: ${translateStatus(payload.new_status, language)}`,
      ``,
      `Thanks for your patience!`,
    ].join("\n")
  }

  if (eventType === "checkout.abandoned") {
    const aPayload = payload as unknown as AbandonedCheckoutPayload
    const itemsBlock = aPayload.cart_items?.length
      ? aPayload.cart_items
          .map(
            (i) =>
              `  ${i.product_name}${i.variant_options ? ` (${i.variant_options})` : ""} x${i.quantity} — ${i.product_price} ${currency}`
          )
          .join("\n")
      : null

    const lines = [
      `Hey ${firstName}! You left some items in your cart at *${aPayload.store_name}*.`,
      ``,
    ]

    if (itemsBlock) {
      lines.push(itemsBlock, ``)
    }

    lines.push(`*Total: ${aPayload.total} ${currency}*`)
    lines.push(``)
    lines.push(`Complete your order here:`)
    lines.push(aPayload.store_url)
    lines.push(``)
    lines.push(`We saved everything for you!`)

    return lines.join("\n")
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
): Promise<{ confirmationSent: boolean }> {
  if (!config.connected || !config.instance_name) return { confirmationSent: false }

  const enabledEvents = config.enabled_events ?? ["order.created"]
  if (!enabledEvents.includes(eventType)) return { confirmationSent: false }

  const codConfirmation =
    eventType === "order.created" &&
    !!config.cod_confirmation_enabled &&
    !!payload.order_id

  const message =
    (await generateAIMessage(eventType, payload, storeName, currency, storeLanguage || "en", codConfirmation)) ||
    buildWhatsAppMessage(eventType, payload, storeName, currency, storeLanguage || "en", codConfirmation)
  if (!message) return { confirmationSent: false }

  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  if (!evolutionUrl || !evolutionKey) {
    throw new Error("Evolution API not configured")
  }

  const phone = normalizePhone(payload.customer_phone, payload.customer_country)

  const res = await fetch(
    urlJoin(evolutionUrl, "message/sendText", config.instance_name),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
        linkPreview: eventType === "checkout.abandoned",
      }),
      signal: AbortSignal.timeout(15000),
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`WhatsApp API error ${res.status}: ${body}`)
  }

  return { confirmationSent: codConfirmation }
}
