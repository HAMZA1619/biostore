import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersTable } from "@/components/dashboard/orders-table"
import { T } from "@/components/dashboard/translated-text"

const PAGE_SIZE = 20

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
    .range(0, PAGE_SIZE - 1)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold"><T k="orders.title" /></h1>
      <OrdersTable
        initialOrders={orders || []}
        currency={store.currency}
        hasMore={(orders?.length || 0) === PAGE_SIZE}
      />
    </div>
  )
}
