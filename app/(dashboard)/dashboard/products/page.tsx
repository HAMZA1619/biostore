import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProductSearch } from "@/components/dashboard/product-search"
import { ProductsTable } from "@/components/dashboard/products-table"
import { T } from "@/components/dashboard/translated-text"

const PAGE_SIZE = 20

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  let query = supabase
    .from("products")
    .select("id, name, sku, price, status, collections(name), product_variants(id)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (q?.trim()) {
    query = query.ilike("name", `%${q.trim()}%`)
  }

  const { data: products } = await query

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold"><T k="products.title" /></h1>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="me-2 h-4 w-4" />
            <T k="products.addProduct" />
          </Link>
        </Button>
      </div>

      <ProductSearch />

      <ProductsTable
        initialProducts={products || []}
        currency={store.currency}
        hasMore={(products?.length || 0) === PAGE_SIZE}
        search={q}
      />
    </div>
  )
}
