import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CollectionsManager } from "@/components/forms/collection-form"

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

  const { data: collections } = await supabase
    .from("collections")
    .select("*, products(count)")
    .eq("store_id", store.id)
    .order("sort_order")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Collections</h1>
      <CollectionsManager storeId={store.id} initialCollections={collections || []} />
    </div>
  )
}
