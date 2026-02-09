"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ORDER_STATUSES } from "@/lib/constants"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const statusConfig: Record<string, { color: string; labelKey: string }> = {
  pending: { color: "bg-yellow-500", labelKey: "orders.statusPending" },
  confirmed: { color: "bg-blue-500", labelKey: "orders.statusConfirmed" },
  shipped: { color: "bg-purple-500", labelKey: "orders.statusShipped" },
  delivered: { color: "bg-green-500", labelKey: "orders.statusDelivered" },
  canceled: { color: "bg-red-400", labelKey: "orders.statusCanceled" },
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

  const cfg = statusConfig[current] || { color: "bg-gray-400", labelKey: current }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[130px] border-transparent bg-transparent px-2 hover:bg-muted/50">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
            <span className="text-sm">{t(cfg.labelKey)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => {
          const c = statusConfig[s] || { color: "bg-gray-400", labelKey: s }
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.color}`} />
                {t(c.labelKey)}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
