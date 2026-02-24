import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MarketForm } from "@/components/forms/market-form"

export default async function NewMarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  return (
    <div className="space-y-6">
      <MarketForm storeId={store.id} />
    </div>
  )
}
