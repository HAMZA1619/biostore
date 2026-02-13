import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { T } from "@/components/dashboard/translated-text"
import { BillingSection } from "@/components/dashboard/billing-section"
import { InvoicesSection } from "@/components/dashboard/invoices-section"
import { getSubscriptionAccess } from "@/lib/subscription"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const access = getSubscriptionAccess(
    profile ?? { subscription_status: null, trial_ends_at: null }
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold"><T k="settings.title" /></h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground"><T k="settings.profile" /></h2>
        <div className="divide-y rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground"><T k="settings.name" /></span>
            <span>{profile?.full_name || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground"><T k="settings.email" /></span>
            <span>{user.email}</span>
          </div>
        </div>
      </section>

      <BillingSection access={access} />
      <InvoicesSection />
    </div>
  )
}
