import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DiscountForm } from "@/components/forms/discount-form"

export default async function NewDiscountPage() {
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
    .select("id, name")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("name")

  return (
    <DiscountForm storeId={store.id} currency={store.currency} markets={markets || []} />
  )
}
