import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import { OrderStatusSelect } from "@/components/dashboard/order-status-select"
import {
  ImageIcon,
  ChevronRight,
  Phone,
  Mail,
  StickyNote,
  Banknote,
  Globe,
} from "lucide-react"
import { T } from "@/components/dashboard/translated-text"
import { FormattedDateTime } from "@/components/dashboard/formatted-date"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: store }, { data: items }] = await Promise.all([
    supabase.from("stores").select("id, currency").eq("owner_id", user.id).single(),
    supabase.from("order_items").select("*").eq("order_id", orderId),
  ])

  if (!store) redirect("/dashboard/store")

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .single()

  if (!order) notFound()

  const itemCount = items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  const initials = order.customer_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/orders" className="hover:text-foreground">
          <T k="orders.title" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-foreground font-medium">
          #{order.order_number}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">#{order.order_number}</h1>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground"><FormattedDateTime date={order.created_at} /></p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Items */}
          <div>
            <h2 className="text-sm font-semibold mb-3"><T k="orderDetail.items" /></h2>
            <div className="divide-y">
              {items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 py-3"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-14 w-14 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground/40">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {item.product_name}
                    </p>
                    {item.variant_options && (
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {Object.entries(
                          item.variant_options as Record<string, string>
                        ).map(([k, v]) => (
                          <span key={k}>
                            {k}: <span className="font-medium">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-end shrink-0 text-sm">
                    <span className="text-muted-foreground">
                      {formatPrice(item.product_price, store.currency)} × {item.quantity}
                    </span>
                    <p className="font-medium mt-0.5">
                      {formatPrice(
                        item.product_price * item.quantity,
                        store.currency
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Banknote className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm"><T k="orderDetail.cashOnDelivery" /></span>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <T k="orderDetail.originalOrder" /> &bull; <FormattedDateTime date={order.created_at} />
              </p>

              <Separator />

              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">
                  <T k="orderDetail.subtotal" />{" "}
                  <span className="text-primary">
                    <T k={itemCount === 1 ? "orderDetail.item" : "orderDetail.items_plural"} values={{ count: String(itemCount) }} />
                  </span>
                </span>
                <span>{formatPrice(order.subtotal, store.currency)}</span>
              </div>

              {order.delivery_fee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground"><T k="orderDetail.delivery" /></span>
                  <span>
                    {formatPrice(order.delivery_fee, store.currency)}
                  </span>
                </div>
              )}

              {order.discount_amount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span><T k="orderDetail.discount" /></span>
                  <span>-{formatPrice(order.discount_amount, store.currency)}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between pt-1 font-semibold">
                <span><T k="orderDetail.total" /></span>
                <span>{formatPrice(order.total, store.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {order.customer_name}
              </p>
              {order.customer_country &&
                order.customer_country !== "Unknown" && (
                  <p className="text-xs text-muted-foreground">
                    {order.customer_country}
                  </p>
                )}
            </div>
          </div>

          <Separator />

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold mb-3"><T k="orderDetail.contactInfo" /></h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Shipping address */}
          <div>
            <h3 className="text-sm font-semibold mb-3"><T k="orderDetail.shippingAddress" /></h3>
            <div className="space-y-1 text-sm">
              <p>{order.customer_name}</p>
              <p className="text-muted-foreground">{order.customer_address}</p>
              {order.customer_city && (
                <p className="text-muted-foreground">{order.customer_city}</p>
              )}
              {order.customer_country &&
                order.customer_country !== "Unknown" && (
                  <p className="text-muted-foreground">
                    {order.customer_country}
                  </p>
                )}
            </div>
          </div>

          {/* IP Address */}
          {order.ip_address && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  <T k="orderDetail.ipAddress" />
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {order.ip_address}
                </p>
              </div>
            </>
          )}

          {/* Order note */}
          {order.note && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5" />
                  <T k="orderDetail.note" />
                </h3>
                <p className="text-sm text-muted-foreground italic">
                  {order.note}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
