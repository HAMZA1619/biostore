import urlJoin from "url-join"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Coins } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardAnalytics } from "@/components/dashboard/analytics"
import { T } from "@/components/dashboard/translated-text"
import { getCurrencySymbol } from "@/lib/utils"

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

  const [{ count: productCount }, { data: orders }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
    supabase.from("orders").select("total, status").eq("store_id", store.id),
  ])

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold"><T k="dashboard.overview" /></h1>
        {store.is_published && (
          <Link
            href={store.custom_domain && store.domain_verified ? `https://${store.custom_domain}` : `/${store.slug}`}
            target="_blank"
            className="max-w-full truncate text-sm text-primary underline"
          >
            {store.custom_domain && store.domain_verified
              ? store.custom_domain
              : urlJoin(process.env.NEXT_PUBLIC_APP_URL!, store.slug)}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="gap-3 py-5">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground"><T k="dashboard.products" /></CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4.5 w-4.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{productCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="gap-3 py-5">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground"><T k="dashboard.orders" /></CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-4.5 w-4.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orders?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="gap-3 py-5 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground"><T k="dashboard.revenue" /></CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Coins className="h-4.5 w-4.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="truncate text-3xl font-bold">{getCurrencySymbol(store.currency)} {totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <DashboardAnalytics storeId={store.id} currency={store.currency} firstName={firstName} />
    </div>
  )
}
