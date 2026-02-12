import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DesignBuilder } from "@/components/dashboard/design-builder"

export default async function DesignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, currency, design_settings")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  return <DesignBuilder store={store} />
}
