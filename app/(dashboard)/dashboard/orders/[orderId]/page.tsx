import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { OrderStatusUpdate } from "@/components/dashboard/order-status-update"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .single()

  if (!order) notFound()

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
        <Badge>{order.status}</Badge>
      </div>

      <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.customer_name}</p>
            <p>{order.customer_phone}</p>
            <p>{order.customer_city}</p>
            <p className="text-muted-foreground">{order.customer_address}</p>
            {order.note && (
              <p className="mt-2 italic text-muted-foreground">Note: {order.note}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Method: {order.payment_method === "cod" ? "Cash on delivery" : "Bank transfer"}</p>
            <p>Subtotal: {formatPrice(order.subtotal)}</p>
            {order.delivery_fee > 0 && <p>Delivery: {formatPrice(order.delivery_fee)}</p>}
            <p className="font-bold">Total: {formatPrice(order.total)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.product_price)} x {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  {formatPrice(item.product_price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Placed on {new Date(order.created_at).toLocaleString()}
      </p>
    </div>
  )
}
