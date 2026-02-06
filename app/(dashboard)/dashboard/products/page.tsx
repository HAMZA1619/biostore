import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { Plus } from "lucide-react"
import { ProductActions } from "@/components/dashboard/delete-product-button"
import { ProductSearch } from "@/components/dashboard/product-search"
import { ProductStatusSelect } from "@/components/dashboard/product-status-select"

const PAGE_SIZE = 20

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  const currentPage = Math.max(0, parseInt(page || "0", 10))

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
    .select("*, collections(name), product_variants(id)", { count: "exact" })
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

  if (q?.trim()) {
    query = query.ilike("name", `%${q.trim()}%`)
  }

  const { data: products, count } = await query
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) p.set(k, v)
      else p.delete(k)
    })
    const str = p.toString()
    return str ? `?${str}` : "?"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      <ProductSearch />

      {products && products.length > 0 ? (
        <>
        <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  <Link href={`/dashboard/products/${product.id}/edit`} className="hover:underline">
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.sku || "—"}</TableCell>
                <TableCell>{formatPrice(product.price, store.currency)}</TableCell>
                <TableCell>
                  {(product.collections as { name: string } | null)?.name || "—"}
                </TableCell>
                <TableCell>
                  <ProductStatusSelect productId={product.id} status={product.status || "active"} />
                </TableCell>
                <TableCell className="text-right">
                  <ProductActions productId={product.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              {currentPage > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href={buildUrl({ page: String(currentPage - 1) })}>Previous</Link>
                </Button>
              )}
              {currentPage + 1 < totalPages && (
                <Button asChild size="sm" variant="outline">
                  <Link href={buildUrl({ page: String(currentPage + 1) })}>Next</Link>
                </Button>
              )}
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          {q ? "No products match your search." : "No products yet. Add your first product to get started."}
        </div>
      )}
    </div>
  )
}
