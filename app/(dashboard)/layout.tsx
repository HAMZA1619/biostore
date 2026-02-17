import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { TrialBanner } from "@/components/dashboard/trial-banner"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSubscriptionAccess, type SubscriptionAccess } from "@/lib/subscription"
import { SubscriptionGate } from "@/components/dashboard/subscription-gate"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single()

  const access: SubscriptionAccess = getSubscriptionAccess(
    profile ?? { subscription_status: null, trial_ends_at: null }
  )

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const isSettingsPage = pathname.startsWith("/dashboard/settings")

  const showGate = !access.hasAccess && !isSettingsPage

  return (
    <I18nProvider>
      {access.status === "trialing" && access.trialDaysLeft !== null && (
        <TrialBanner daysLeft={access.trialDaysLeft} />
      )}
      <div className="flex h-[calc(100vh-var(--trial-banner-height,0px))]">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader access={access} />
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:px-16 md:py-8 md:pb-8">
            <div className="mx-auto max-w-5xl">
              {showGate ? <SubscriptionGate /> : children}
            </div>
          </main>
        </div>
      </div>
      <LanguageSwitcher />
    </I18nProvider>
  )
}
