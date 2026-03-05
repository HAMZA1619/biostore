"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { T } from "@/components/dashboard/translated-text"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const localeMap: Record<string, string> = { en: "en-US", ar: "ar-SA", fr: "fr-FR" }

interface Order {
  id: string
  created_at: string
  amount: number
  currency: string
  status: string
  billing_reason: string
}

export function InvoicesSection() {
  const { i18n } = useTranslation()
  const locale = localeMap[i18n.language] || i18n.language
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/billing/invoices")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false))
  }, [])

  const statusColor: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    refunded: "bg-gray-50 text-gray-500 dark:bg-gray-900/40 dark:text-gray-400",
    partially_refunded: "bg-gray-50 text-gray-500 dark:bg-gray-900/40 dark:text-gray-400",
  }

  function formatAmount(cents: number, currency: string) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground"><T k="billing.invoices" /></h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          <T k="billing.noInvoices" />
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {formatAmount(order.amount, order.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString(locale)}
                </p>
              </div>
              <Badge variant="secondary" className={statusColor[order.status] ?? ""}>
                {order.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
