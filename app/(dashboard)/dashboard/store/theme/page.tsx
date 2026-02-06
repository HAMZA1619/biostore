import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DesignBuilder } from "@/components/dashboard/design-builder"

export default async function DesignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, currency, logo_url, banner_url, primary_color, accent_color, background_color, text_color, button_text_color, font_family, border_radius, theme, show_branding, checkout_show_email, checkout_show_country, checkout_show_city, checkout_show_note, thank_you_message")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  return <DesignBuilder store={store} />
}
