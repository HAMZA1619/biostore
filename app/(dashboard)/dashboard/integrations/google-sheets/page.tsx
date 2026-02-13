import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GoogleSheetsSetup } from "@/components/dashboard/integrations/google-sheets-setup"

export default async function GoogleSheetsPage() {
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

  const { data: integration } = await supabase
    .from("store_integrations")
    .select("*")
    .eq("store_id", store.id)
    .eq("integration_id", "google-sheets")
    .single()

  return (
    <GoogleSheetsSetup
      storeId={store.id}
      installed={integration || null}
    />
  )
}
