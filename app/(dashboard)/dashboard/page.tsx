import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardAnalytics } from "@/components/dashboard/analytics"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const firstName = profile?.full_name?.split(" ")[0] || "there"

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, is_published, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h1 className="text-2xl font-bold">Welcome to BioStore</h1>
        <p className="text-muted-foreground">Create your store to get started</p>
        <Button asChild>
          <Link href="/dashboard/store">Create Store</Link>
        </Button>
      </div>
    )
  }

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)

  const { data: orders } = await supabase
    .from("orders")
    .select("total, status")
    .eq("store_id", store.id)

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        {store.is_published && (
          <Link
            href={`/${store.slug}`}
            target="_blank"
            className="text-sm text-primary underline"
          >
            {process.env.NEXT_PUBLIC_APP_URL}/{store.slug}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{productCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} {store.currency}</p>
          </CardContent>
        </Card>
      </div>

      <DashboardAnalytics storeId={store.id} currency={store.currency} firstName={firstName} />
    </div>
  )
}
