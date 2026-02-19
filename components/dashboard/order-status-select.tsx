"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ORDER_STATUSES } from "@/lib/constants"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const statusConfig: Record<string, { dot: string; bg: string; labelKey: string }> = {
  pending: { dot: "bg-yellow-500", bg: "border border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", labelKey: "orders.statusPending" },
  confirmed: { dot: "bg-blue-500", bg: "border border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400", labelKey: "orders.statusConfirmed" },
  shipped: { dot: "bg-purple-500", bg: "border border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400", labelKey: "orders.statusShipped" },
  delivered: { dot: "bg-green-500", bg: "border border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400", labelKey: "orders.statusDelivered" },
  canceled: { dot: "bg-red-400", bg: "border border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400", labelKey: "orders.statusCanceled" },
}

interface OrderStatusSelectProps {
  orderId: string
  status: string
}

export function OrderStatusSelect({ orderId, status }: OrderStatusSelectProps) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(status)
  const router = useRouter()
  const supabase = createClient()

  async function handleChange(value: string) {
    const prev = current
    setCurrent(value)

    const { error } = await supabase
      .from("orders")
      .update({ status: value, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) {
      setCurrent(prev)
      toast.error(t("orders.failedUpdateStatus"))
    } else {
      router.refresh()
    }
  }

  const cfg = statusConfig[current] || { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600", labelKey: current }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger size="sm" className={`h-auto w-auto gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-none ${cfg.bg}`}>
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
            {t(cfg.labelKey)}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => {
          const c = statusConfig[s] || { dot: "bg-gray-400", bg: "", labelKey: s }
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {t(c.labelKey)}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
