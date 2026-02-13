"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { OrderStatusSelect } from "@/components/dashboard/order-status-select"
import { RelativeDate } from "@/components/dashboard/relative-date"
import { Loader2, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface Order {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_country: string | null
  total: number
  status: string
  created_at: string
}

interface OrdersTableProps {
  initialOrders: Order[]
  currency: string
  hasMore: boolean
}

export function OrdersTable({ initialOrders, currency, hasMore: initialHasMore }: OrdersTableProps) {
  const { t } = useTranslation()
  const [orders, setOrders] = useState(initialOrders)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSearch = useCallback(async (query: string) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/orders/list?page=0&search=${encodeURIComponent(query)}`)
      if (!res.ok) return
      const data = await res.json()
      setOrders(data.orders)
      setHasMore(data.hasMore)
      setPage(1)
    } finally {
      setSearching(false)
    }
  }, [])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setOrders(initialOrders)
      setHasMore(initialHasMore)
      setPage(1)
      return
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, 400)
  }

  function clearSearch() {
    setSearch("")
    setOrders(initialOrders)
    setHasMore(initialHasMore)
    setPage(1)
  }

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/orders/list?${params}`)
      if (!res.ok) {
        setHasMore(false)
        return
      }
      const data = await res.json()
      setOrders((prev) => [...prev, ...data.orders])
      setHasMore(data.hasMore)
      setPage((p) => p + 1)
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = orders.length === 0 && !search.trim()
  const noResults = orders.length === 0 && !!search.trim()

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("orders.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("orders.searchPlaceholder")}
          className="ps-9 pe-9"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        )}
      </div>

      {noResults ? (
        <div className="py-12 text-center text-muted-foreground">
          {t("orders.noResults")}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders.columns.number")}</TableHead>
                  <TableHead>{t("orders.columns.customer")}</TableHead>
                  <TableHead>{t("orders.columns.phone")}</TableHead>
                  <TableHead>{t("orders.columns.country")}</TableHead>
                  <TableHead>{t("orders.columns.total")}</TableHead>
                  <TableHead>{t("orders.columns.status")}</TableHead>
                  <TableHead>{t("orders.columns.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="relative cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="absolute inset-0"
                      />
                      <span className="relative font-medium text-primary">
                        #{order.order_number}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{order.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{order.customer_phone}</TableCell>
                    <TableCell className="text-muted-foreground">{order.customer_country || "—"}</TableCell>
                    <TableCell>{formatPrice(order.total, currency)}</TableCell>
                    <TableCell className="relative z-10">
                      <OrderStatusSelect orderId={order.id} status={order.status} />
                    </TableCell>
                    <TableCell>
                      <RelativeDate date={order.created_at} />
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
                {t("orders.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
