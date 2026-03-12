import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CollectionsManager } from "@/components/forms/collection-form"
import { checkResourceLimit } from "@/lib/check-limit"
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner"

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const [{ data: collections }, limit] = await Promise.all([
    supabase
      .from("collections")
      .select("*, products(count)")
      .eq("store_id", store.id)
      .order("sort_order"),
    checkResourceLimit(supabase, user.id, store.id, "collections"),
  ])

  return (
    <div className="space-y-4">
      {limit.tier === "free" && (
        <UpgradeBanner
          resource="collections"
          current={limit.current}
          limit={limit.limit}
          variant={limit.allowed ? "warning" : "blocked"}
        />
      )}
      <CollectionsManager
        storeId={store.id}
        initialCollections={collections || []}
        limitReached={!limit.allowed}
      />
    </div>
  )
}
