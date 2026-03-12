import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShippingManager } from "@/components/dashboard/shipping-manager"
import { checkResourceLimit } from "@/lib/check-limit"
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner"

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

  const [{ data: zones }, { data: markets }, limit] = await Promise.all([
    supabase
      .from("shipping_zones")
      .select("*, shipping_city_rates(*)")
      .eq("store_id", store.id)
      .is("market_id", null)
      .order("country_name"),
    supabase
      .from("markets")
      .select("id, name")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false }),
    checkResourceLimit(supabase, user.id, store.id, "shipping_zones"),
  ])

  return (
    <div className="space-y-4">
      {limit.tier === "free" && (
        <UpgradeBanner
          resource="shipping zones"
          current={limit.current}
          limit={limit.limit}
          variant={limit.allowed ? "warning" : "blocked"}
        />
      )}
      <ShippingManager initialZones={zones || []} currency={store.currency} markets={markets || []} limitReached={!limit.allowed} />
    </div>
  )
}
