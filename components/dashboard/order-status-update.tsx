"use client"

import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ORDER_STATUSES } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const statusLabelKeys: Record<string, string> = {
  pending: "orders.statusPending",
  confirmed: "orders.statusConfirmed",
  shipped: "orders.statusShipped",
  delivered: "orders.statusDelivered",
  canceled: "orders.statusCanceled",
}

export function OrderStatusUpdate({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(t("orders.statusUpdatedTo", { status: t(statusLabelKeys[status] || status) }))
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">{t("orders.updateStatus")}</span>
      <Select value={currentStatus} onValueChange={updateStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {t(statusLabelKeys[status] || status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
