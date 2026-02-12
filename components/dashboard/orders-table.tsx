"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { OrderStatusSelect } from "@/components/dashboard/order-status-select"
import { RelativeDate } from "@/components/dashboard/relative-date"
import { Loader2 } from "lucide-react"
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

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const res = await fetch(`/api/orders/list?page=${page}`)
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

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("orders.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}
