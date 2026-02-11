import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { IntegrationManager } from "@/components/dashboard/integration-manager"

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: installed } = await supabase
    .from("store_integrations")
    .select("*")
    .eq("store_id", store.id)

  return (
    <div className="space-y-4">
      <IntegrationManager
        storeId={store.id}
        installedIntegrations={installed || []}
      />
    </div>
  )
}
