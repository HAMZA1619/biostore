import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AbandonedCheckoutsTable } from "@/components/dashboard/abandoned-checkouts-table"

const PAGE_SIZE = 20

export default async function AbandonedCheckoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: checkouts } = await supabase
    .from("abandoned_checkouts")
    .select("id, customer_name, customer_phone, cart_items, currency, total, status, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <AbandonedCheckoutsTable
      initialCheckouts={checkouts || []}
      hasMore={(checkouts?.length || 0) === PAGE_SIZE}
    />
  )
}
