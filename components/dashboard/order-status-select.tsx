"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/constants"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const statusConfig: Record<string, { dot: string; bg: string; labelKey: string }> = {
  pending: { dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", labelKey: "orders.statusPending" },
  confirmed: { dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300", labelKey: "orders.statusConfirmed" },
  shipped: { dot: "bg-violet-400", bg: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300", labelKey: "orders.statusShipped" },
  delivered: { dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", labelKey: "orders.statusDelivered" },
  returned: { dot: "bg-orange-400", bg: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300", labelKey: "orders.statusReturned" },
  canceled: { dot: "bg-rose-400", bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300", labelKey: "orders.statusCanceled" },
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

  const transitions = ORDER_STATUS_TRANSITIONS[current as OrderStatus] || []
  const isTerminal = transitions.length === 0

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

  if (isTerminal) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg}`}>
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        {t(cfg.labelKey)}
      </span>
    )
  }

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
        {[current as OrderStatus, ...transitions].map((s) => {
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
