"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ProductActions } from "@/components/dashboard/delete-product-button"
import { ProductStatusSelect } from "@/components/dashboard/product-status-select"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  status: string
  collections: { name: string }[] | { name: string } | null
  product_variants: { id: string }[] | null
}

interface ProductsTableProps {
  initialProducts: Product[]
  currency: string
  storeId?: string
  hasMore: boolean
  search?: string
}

export function ProductsTable({ initialProducts, currency, storeId, hasMore: initialHasMore, search }: ProductsTableProps) {
  const { t } = useTranslation()
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set("q", search)

      const res = await fetch(`/api/products/list?${params}`)
      if (!res.ok) {
        setHasMore(false)
        return
      }
      const data = await res.json()
      setProducts((prev) => [...prev, ...data.products])
      setHasMore(data.hasMore)
      setPage((p) => p + 1)
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {search ? t("products.emptySearch") : t("products.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("products.columns.name")}</TableHead>
              <TableHead>{t("products.columns.sku")}</TableHead>
              <TableHead>{t("products.columns.price")}</TableHead>
              <TableHead>{t("products.columns.collection")}</TableHead>
              <TableHead>{t("products.columns.status")}</TableHead>
              <TableHead className="w-[100px] text-end">{t("products.columns.actions")}</TableHead>
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
                <TableCell>{formatPrice(product.price, currency)}</TableCell>
                <TableCell>
                  {(Array.isArray(product.collections) ? product.collections[0]?.name : product.collections?.name) || "—"}
                </TableCell>
                <TableCell>
                  <ProductStatusSelect productId={product.id} status={product.status || "active"} />
                </TableCell>
                <TableCell className="text-end">
                  <ProductActions productId={product.id} storeId={storeId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("products.loadMore")}
          </Button>
        </div>
      )}
    </div>
  )
}
