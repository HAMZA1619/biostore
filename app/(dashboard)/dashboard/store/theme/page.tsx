import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DesignBuilder } from "@/components/dashboard/design-builder"

export default async function DesignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, logo_url, banner_url, primary_color, accent_color, theme, show_branding, phone")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Design</h1>
      <DesignBuilder store={store} />
    </div>
  )
}
