import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StoreForm } from "@/components/forms/store-form"
import { DomainSettings } from "@/components/forms/domain-settings"
export default async function StorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  return (
    <StoreForm
      userId={user.id}
      title={store ? "storeForm.storeSettings" : "storeForm.createYourStore"}
      initialData={store}
    >
      {store && (
        <DomainSettings
          currentDomain={store.custom_domain}
          domainVerified={store.domain_verified}
        />
      )}
    </StoreForm>
  )
}
