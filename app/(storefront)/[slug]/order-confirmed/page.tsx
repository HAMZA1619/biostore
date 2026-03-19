import { Button } from "@/components/ui/button"
import { parseDesignSettings, getImageUrl, formatPriceSymbol } from "@/lib/utils"
import Link from "next/link"
import { headers } from "next/headers"
import { getT } from "@/lib/i18n/storefront"
import { getStoreBySlug } from "@/lib/storefront/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import Image from "next/image"
import { CopyOrderNumber } from "@/components/store/copy-order-number"

type OrderData = {
  order_number: number
  customer_name: string
  customer_address: string
  customer_city: string | null
  customer_country: string
  total: number
  subtotal: number
  delivery_fee: number
  discount_amount: number
  currency: string
  payment_method: string
  order_items: {
    product_name: string
    product_price: number
    quantity: number
    variant_options: Record<string, string> | null
    image_url: string | null
  }[]
}

const ORDER_FIELDS = "order_number, customer_name, customer_address, customer_city, customer_country, total, subtotal, delivery_fee, discount_amount, currency, payment_method, order_items(product_name, product_price, quantity, variant_options, image_url)"

async function fetchOrder(storeId: string, orderNumber: string): Promise<OrderData | null> {
  const { data } = await createAdminClient()
    .from("orders")
    .select(ORDER_FIELDS)
    .eq("store_id", storeId)
    .eq("order_number", parseInt(orderNumber, 10))
    .single()
  return data as OrderData | null
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ order?: string }>
}) {
  const { slug } = await params
  const { order: orderNumber } = await searchParams

  const store = await getStoreBySlug(slug, "id, currency, design_settings")

  const headersList = await headers()
  const isCustomDomain = headersList.get("x-custom-domain") === "true"
  const baseHref = isCustomDomain ? "" : `/${slug}`

  const ds = parseDesignSettings((store?.design_settings || {}) as Record<string, unknown>)
  const t = getT(ds.language)
  const message = ds.thankYouMessage || t("storefront.defaultThankYou")

  const order = orderNumber && store?.id ? await fetchOrder(store.id, orderNumber) : null
  const currency = order?.currency || store?.currency || "USD"
  const fmt = (n: number) => formatPriceSymbol(n, currency)

  return (
    <div className="flex flex-col items-center gap-6 py-10 px-4">
      <AnimatedCheckmark />

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">{t("storefront.orderConfirmed")}</h1>
        {orderNumber && (
          <CopyOrderNumber
            orderNumber={orderNumber}
            label={t("storefront.orderNumber", { number: orderNumber })}
            copiedText={t("storefront.copied")}
          />
        )}
      </div>

      <p className="max-w-sm text-center opacity-60">{message}</p>

      {order && (
        <div className="w-full max-w-sm space-y-4">
          {ds.thankYouShowSummary && (
            <OrderSummary order={order} currency={currency} fmt={fmt} t={t} />
          )}

          {ds.thankYouShowCod && order.payment_method === "cod" && (
            <CodBadge total={order.total} fmt={fmt} t={t} />
          )}

          {ds.thankYouShowAddress && (
            <DeliveryAddress order={order} t={t} />
          )}
        </div>
      )}

      <Button asChild size={ds.buttonSize || "default"} style={{
        backgroundImage: "none",
        boxShadow: "none",
        backgroundColor: ds.buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
        color: ds.buttonStyle === "outline" ? "var(--store-accent)" : "var(--store-btn-text)",
        borderRadius: ds.buttonStyle === "pill" ? "9999px" : "var(--store-radius)",
        border: ds.buttonStyle === "outline" ? "2px solid var(--store-accent)" : "none",
      }}>
        <Link href={baseHref || "/"}>{t("storefront.continueShopping")}</Link>
      </Button>
    </div>
  )
}

function AnimatedCheckmark() {
  return (
    <>
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full animate-[scale-in_0.4s_ease-out]"
        style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}
      >
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" className="[stroke-dasharray:30] [stroke-dashoffset:30] animate-[draw-check_0.5s_ease-out_0.3s_forwards]" />
        </svg>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scale-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes draw-check { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
      `}} />
    </>
  )
}

function OrderSummary({ order, currency, fmt, t }: { order: OrderData; currency: string; fmt: (n: number) => string; t: (key: string) => string }) {
  return (
    <>
      <div className="rounded-lg border divide-y">
        {order.order_items.map((item, i) => {
          const imgUrl = getImageUrl(item.image_url)
          return (
            <div key={i} className="flex items-center gap-3 p-3">
              {imgUrl ? (
                <Image src={imgUrl} alt={item.product_name} width={48} height={48} className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-current/5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product_name}</p>
                {item.variant_options && (
                  <p className="truncate text-xs opacity-50">
                    {Object.values(item.variant_options).join(" / ")}
                  </p>
                )}
                <p className="text-xs opacity-50">x{item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {fmt(item.product_price * item.quantity)}
              </p>
            </div>
          )
        })}
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between opacity-60">
          <span>{t("storefront.subtotal")}</span>
          <span>{fmt(order.subtotal)}</span>
        </div>
        {order.delivery_fee > 0 && (
          <div className="flex justify-between opacity-60">
            <span>{t("storefront.deliveryFee")}</span>
            <span>{fmt(order.delivery_fee)}</span>
          </div>
        )}
        {order.discount_amount > 0 && (
          <div className="flex justify-between opacity-60">
            <span>{t("storefront.discount")}</span>
            <span>-{fmt(order.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1.5 font-bold">
          <span>{t("storefront.total")}</span>
          <span>{fmt(order.total)}</span>
        </div>
      </div>
    </>
  )
}

function CodBadge({ total, fmt, t }: { total: number; fmt: (n: number) => string; t: (key: string) => string }) {
  return (
    <div className="rounded-lg border-2 border-dashed p-3 text-center" style={{ borderColor: "var(--store-accent)" }}>
      <p className="text-xs font-medium opacity-60">{t("storefront.codPayment")}</p>
      <p className="text-lg font-bold" style={{ color: "var(--store-accent)" }}>
        {fmt(total)}
      </p>
    </div>
  )
}

function DeliveryAddress({ order, t }: { order: OrderData; t: (key: string) => string }) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <p className="text-xs font-medium opacity-50">{t("storefront.deliveryTo")}</p>
      <p className="text-sm font-medium">{order.customer_name}</p>
      <p className="text-sm opacity-70">
        {[order.customer_address, order.customer_city, order.customer_country].filter(Boolean).join(", ")}
      </p>
    </div>
  )
}
