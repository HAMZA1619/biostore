import { createClient } from "@/lib/supabase/server"
import { getStoreUrl } from "@/lib/utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardAnalytics } from "@/components/dashboard/analytics"
import { T } from "@/components/dashboard/translated-text"
import { getExchangeRate } from "@/lib/market/exchange-rates"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: store }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("stores").select("id, name, slug, is_published, currency, custom_domain, domain_verified").eq("owner_id", user.id).single(),
  ])

  const firstName = profile?.full_name?.split(" ")[0] || "there"

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h1 className="text-2xl font-bold"><T k="dashboard.welcome" /></h1>
        <p className="text-muted-foreground"><T k="dashboard.createStorePrompt" /></p>
        <Button asChild>
          <Link href="/dashboard/store"><T k="dashboard.createStore" /></Link>
        </Button>
      </div>
    )
  }

  const [{ count: productCount }, { data: orders }, { data: markets }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
    supabase.from("orders").select("total, currency, status, market_id").eq("store_id", store.id),
    supabase.from("markets").select("id, name, slug, currency, is_default, price_adjustment").eq("store_id", store.id).order("is_default", { ascending: false }),
  ])

  // Fetch exchange rates for each unique market currency → store currency
  const uniqueCurrencies = [...new Set((markets || []).map((m) => m.currency))].filter((c) => c !== store.currency)
  const rateEntries = await Promise.all(
    uniqueCurrencies.map(async (c) => [c, await getExchangeRate(c, store.currency)] as const)
  )
  const exchangeRates: Record<string, number> = Object.fromEntries(rateEntries)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold"><T k="dashboard.overview" /></h1>
        {store.is_published && (
          <Link
            href={getStoreUrl(store.slug, store.custom_domain, store.domain_verified)}
            target="_blank"
            className="max-w-full truncate text-sm text-primary underline"
          >
            {getStoreUrl(store.slug, store.custom_domain, store.domain_verified).replace(/^https?:\/\//, "")}
          </Link>
        )}
      </div>

      <DashboardAnalytics
        storeId={store.id}
        currency={store.currency}
        markets={markets || []}
        exchangeRates={exchangeRates}
        productCount={productCount || 0}
        totalOrders={orders || []}
        firstName={firstName}
      />
    </div>
  )
}
