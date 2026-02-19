"use client"

import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { RelativeDate } from "@/components/dashboard/relative-date"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface AbandonedCheckout {
  id: string
  customer_name: string | null
  customer_phone: string
  cart_items: { product_name: string; product_price: number; quantity: number }[]
  currency: string
  total: number
  status: string
  created_at: string
}

interface Props {
  checkouts: AbandonedCheckout[]
  currency: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  recovered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
}

export function AbandonedCheckoutsTable({ checkouts, currency }: Props) {
  const { t } = useTranslation()

  if (checkouts.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        {t("abandonedCheckouts.empty")}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("abandonedCheckouts.customer")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("abandonedCheckouts.phone")}</TableHead>
            <TableHead className="text-end">{t("abandonedCheckouts.total")}</TableHead>
            <TableHead>{t("abandonedCheckouts.status")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("abandonedCheckouts.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkouts.map((c) => {
            const itemCount = c.cart_items?.reduce((sum, i) => sum + i.quantity, 0) || 0
            return (
              <TableRow key={c.id} className="relative cursor-pointer">
                <TableCell>
                  <Link
                    href={`/dashboard/abandoned-checkouts/${c.id}`}
                    className="absolute inset-0"
                  />
                  <div className="relative min-w-0">
                    <p className="truncate font-medium">{c.customer_name || c.customer_phone}</p>
                    <p className="truncate text-xs text-muted-foreground sm:hidden" dir="ltr">
                      {c.customer_name ? c.customer_phone : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {itemCount} {itemCount === 1 ? t("abandonedCheckouts.item") : t("abandonedCheckouts.items")}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell"><span dir="ltr">{c.customer_phone}</span></TableCell>
                <TableCell className="text-end">{formatPrice(c.total, c.currency || currency)}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || ""}`}>
                    {t(`abandonedCheckouts.statusLabels.${c.status}`)}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <RelativeDate date={c.created_at} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
