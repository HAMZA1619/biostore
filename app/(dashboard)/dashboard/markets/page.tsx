import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MarketsTable } from "@/components/dashboard/markets-table"
import { checkResourceLimit } from "@/lib/check-limit"
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner"

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

  const [{ data: markets }, limit] = await Promise.all([
    supabase
      .from("markets")
      .select("*")
      .eq("store_id", store.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    checkResourceLimit(supabase, user.id, store.id, "markets"),
  ])

  return (
    <div className="space-y-4">
      {limit.tier === "free" && (
        <UpgradeBanner
          resource="markets"
          current={limit.current}
          limit={limit.limit}
          variant={limit.allowed ? "warning" : "blocked"}
        />
      )}
      <MarketsTable initialMarkets={markets || []} limitReached={!limit.allowed} />
    </div>
  )
}
