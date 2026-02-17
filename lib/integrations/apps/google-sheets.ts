import { GoogleSheetsIcon } from "@/components/icons/google-sheets"
import type { AppDefinition } from "@/lib/integrations/registry"

export const googleSheetsApp: AppDefinition = {
  id: "google-sheets",
  name: "Google Sheets",
  description: "Automatically sync new orders to a Google Spreadsheet in real time.",
  icon: GoogleSheetsIcon,
  iconColor: "#0F9D58",
  category: "productivity",
  events: ["order.created"],
  hasCustomSetup: true,
}

export type RowGrouping = "per_order" | "per_product"

export interface FieldMapping {
  key: string
  header: string
}

export interface AvailableField {
  key: string
  defaultHeader: string
}

export const ITEM_FIELD_KEYS = new Set([
  "item_name",
  "item_quantity",
  "item_price",
  "item_variants",
])

export const AVAILABLE_FIELDS: AvailableField[] = [
  { key: "order_number", defaultHeader: "Order #" },
  { key: "date", defaultHeader: "Date" },
  { key: "customer_name", defaultHeader: "Customer" },
  { key: "customer_phone", defaultHeader: "Phone" },
  { key: "customer_email", defaultHeader: "Email" },
  { key: "customer_city", defaultHeader: "City" },
  { key: "customer_country", defaultHeader: "Country" },
  { key: "customer_address", defaultHeader: "Address" },
  { key: "item_name", defaultHeader: "Item Name" },
  { key: "item_quantity", defaultHeader: "Item Qty" },
  { key: "item_price", defaultHeader: "Item Price" },
  { key: "item_variants", defaultHeader: "Item Variants" },
  { key: "subtotal", defaultHeader: "Subtotal" },
  { key: "discount_amount", defaultHeader: "Discount" },
  { key: "total", defaultHeader: "Total" },
  { key: "status", defaultHeader: "Status" },
  { key: "note", defaultHeader: "Note" },
  { key: "ip_address", defaultHeader: "IP Address" },
]

export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = AVAILABLE_FIELDS.map(
  (f) => ({ key: f.key, header: f.defaultHeader }),
)

export function getHeaders(mappings?: FieldMapping[]): string[] {
  const m = mappings && mappings.length > 0 ? mappings : DEFAULT_FIELD_MAPPINGS
  return m.map((f) => f.header)
}

interface OrderItem {
  product_name: string
  product_price: number
  quantity: number
  variant_options?: Record<string, string> | null
}

export interface EventPayload {
  order_number: number
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_city?: string
  customer_country?: string
  customer_address?: string
  status: string
  total: number
  subtotal?: number
  discount_id?: string | null
  discount_amount?: number
  note?: string
  ip_address?: string | null
  created_at?: string
  items?: OrderItem[]
  [key: string]: unknown
}

function getOrderFieldValue(
  key: string,
  payload: EventPayload,
  currency: string,
): string {
  switch (key) {
    case "order_number":
      return String(payload.order_number)
    case "date":
      return payload.created_at
        ? new Date(payload.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : new Date().toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
    case "customer_name":
      return payload.customer_name || ""
    case "customer_phone":
      return payload.customer_phone || ""
    case "customer_email":
      return payload.customer_email || ""
    case "customer_city":
      return payload.customer_city || ""
    case "customer_country":
      return payload.customer_country || ""
    case "customer_address":
      return payload.customer_address || ""
    case "subtotal":
      return payload.subtotal != null ? `${payload.subtotal} ${currency}` : ""
    case "discount_amount":
      return payload.discount_amount ? `-${payload.discount_amount} ${currency}` : ""
    case "total":
      return `${payload.total} ${currency}`
    case "status":
      return payload.status || ""
    case "note":
      return payload.note || ""
    case "ip_address":
      return payload.ip_address || ""
    default:
      return ""
  }
}

function getItemFieldValue(
  key: string,
  item: OrderItem,
  currency: string,
): string {
  switch (key) {
    case "item_name":
      return item.product_name || ""
    case "item_quantity":
      return String(item.quantity)
    case "item_price":
      return `${item.product_price} ${currency}`
    case "item_variants":
      if (item.variant_options && Object.keys(item.variant_options).length > 0) {
        return Object.entries(item.variant_options)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      }
      return ""
    default:
      return ""
  }
}

function hasItemFields(mappings: FieldMapping[]): boolean {
  return mappings.some((f) => ITEM_FIELD_KEYS.has(f.key))
}

function buildRow(
  mappings: FieldMapping[],
  payload: EventPayload,
  currency: string,
  item?: OrderItem,
): string[] {
  return mappings.map((field) => {
    if (ITEM_FIELD_KEYS.has(field.key)) {
      return item ? getItemFieldValue(field.key, item, currency) : ""
    }
    return getOrderFieldValue(field.key, payload, currency)
  })
}

function joinItemFieldValues(
  items: OrderItem[],
  key: string,
  currency: string,
): string {
  return items.map((item) => getItemFieldValue(key, item, currency)).join(", ")
}

function buildGroupedOrderRow(
  mappings: FieldMapping[],
  payload: EventPayload,
  currency: string,
  items: OrderItem[],
): string[] {
  return mappings.map((field) => {
    if (ITEM_FIELD_KEYS.has(field.key)) {
      return joinItemFieldValues(items, field.key, currency)
    }
    return getOrderFieldValue(field.key, payload, currency)
  })
}

function mergeItemsByProduct(items: OrderItem[]): OrderItem[] {
  const map = new Map<string, OrderItem>()
  for (const item of items) {
    const variantKey = item.variant_options
      ? JSON.stringify(item.variant_options)
      : ""
    const key = `${item.product_name}::${variantKey}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      map.set(key, { ...item })
    }
  }
  return Array.from(map.values())
}

export function formatOrderRows(
  payload: EventPayload,
  currency: string,
  mappings?: FieldMapping[],
  grouping?: RowGrouping,
): string[][] {
  const m = mappings && mappings.length > 0 ? mappings : DEFAULT_FIELD_MAPPINGS
  const g = grouping || "per_product"

  if (!hasItemFields(m) || !payload.items || payload.items.length === 0) {
    return [buildRow(m, payload, currency)]
  }

  switch (g) {
    case "per_order":
      return [buildGroupedOrderRow(m, payload, currency, payload.items)]
    case "per_product":
    default: {
      const merged = mergeItemsByProduct(payload.items)
      return merged.map((item) => buildRow(m, payload, currency, item))
    }
  }
}
