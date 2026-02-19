import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AbandonedCheckoutsTable } from "@/components/dashboard/abandoned-checkouts-table"
import { T } from "@/components/dashboard/translated-text"

export default async function AbandonedCheckoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: checkouts } = await supabase
    .from("abandoned_checkouts")
    .select("id, customer_name, customer_phone, cart_items, currency, total, status, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold"><T k="abandonedCheckouts.title" /></h1>
      <AbandonedCheckoutsTable checkouts={checkouts || []} currency={store.currency} />
    </div>
  )
}
