import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DiscountForm } from "@/components/forms/discount-form"

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ discountId: string }>
}) {
  const { discountId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: discount } = await supabase
    .from("discounts")
    .select("*")
    .eq("id", discountId)
    .eq("store_id", store.id)
    .single()

  if (!discount) notFound()

  return (
    <DiscountForm storeId={store.id} currency={store.currency} initialData={discount} />
  )
}
