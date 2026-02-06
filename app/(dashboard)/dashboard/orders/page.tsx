import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { OrderStatusSelect } from "@/components/dashboard/order-status-select"
import { RelativeDate } from "@/components/dashboard/relative-date"

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, customer_country, total, status, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="relative cursor-pointer">
                <TableCell>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="absolute inset-0"
                  />
                  <span className="relative font-medium text-primary">
                    #{order.order_number}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{order.customer_name}</TableCell>
                <TableCell className="text-muted-foreground">{order.customer_phone}</TableCell>
                <TableCell className="text-muted-foreground">{order.customer_country || "—"}</TableCell>
                <TableCell>{formatPrice(order.total, store.currency)}</TableCell>
                <TableCell className="relative z-10">
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </TableCell>
                <TableCell>
                  <RelativeDate date={order.created_at} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No orders yet. Share your store link to start receiving orders.
        </div>
      )}
    </div>
  )
}
