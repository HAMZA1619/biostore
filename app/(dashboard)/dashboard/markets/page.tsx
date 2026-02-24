import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MarketsTable } from "@/components/dashboard/markets-table"

export default async function MarketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: markets } = await supabase
    .from("markets")
    .select("*")
    .eq("store_id", store.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  return <MarketsTable initialMarkets={markets || []} />
}
