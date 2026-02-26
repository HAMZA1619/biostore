import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShippingManager } from "@/components/dashboard/shipping-manager"

export default async function ShippingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("*, shipping_city_rates(*)")
    .eq("store_id", store.id)
    .order("country_name")

  return <ShippingManager initialZones={zones || []} currency={store.currency} />
}
