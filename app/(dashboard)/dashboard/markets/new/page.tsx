import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MarketForm } from "@/components/forms/market-form"
import { checkResourceLimit } from "@/lib/check-limit"
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner"

export default async function NewMarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const limit = await checkResourceLimit(supabase, user.id, store.id, "markets")

  if (!limit.allowed) {
    return (
      <UpgradeBanner
        resource="markets"
        current={limit.current}
        limit={limit.limit}
      />
    )
  }

  return (
    <div className="space-y-6">
      {limit.tier === "free" && (
        <UpgradeBanner
          resource="markets"
          current={limit.current}
          limit={limit.limit}
          variant="warning"
        />
      )}
      <MarketForm storeId={store.id} storeCurrency={store.currency} />
    </div>
  )
}
