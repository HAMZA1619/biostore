"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle, Truck, PackageCheck, RotateCcw, X } from "lucide-react"
import { getNextStatuses, isTerminalStatus, type OrderStatus } from "@/lib/constants"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const actionConfig: Record<string, { labelKey: string; icon: typeof CheckCircle; variant: "default" | "destructive" | "outline" }> = {
  confirmed: { labelKey: "orders.confirmOrder", icon: CheckCircle, variant: "default" },
  shipped: { labelKey: "orders.markShipped", icon: Truck, variant: "default" },
  delivered: { labelKey: "orders.markDelivered", icon: PackageCheck, variant: "default" },
  returned: { labelKey: "orders.markReturned", icon: RotateCcw, variant: "outline" },
  canceled: { labelKey: "orders.cancelOrder", icon: X, variant: "outline" },
}

const destructiveStatuses = new Set(["canceled", "returned"])

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const nextStatuses = getNextStatuses(status)

  if (isTerminalStatus(status)) return null

  async function handleUpdate(newStatus: string) {
    setLoading(newStatus)
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    setLoading(null)

    if (error) {
      toast.error(t("orders.failedUpdateStatus"))
    } else {
      const labelKey = actionConfig[newStatus]?.labelKey
      toast.success(t("orders.statusUpdatedTo", { status: labelKey ? t(labelKey) : newStatus }))
      router.refresh()
    }
  }

  const primaryStatuses = nextStatuses.filter((s) => !destructiveStatuses.has(s))
  const secondaryStatuses = nextStatuses.filter((s) => destructiveStatuses.has(s))

  function getDialogText(s: string) {
    if (s === "canceled") return { title: "orders.confirmCancelTitle", desc: "orders.confirmCancelDescription" }
    if (s === "returned") return { title: "orders.confirmReturnTitle", desc: "orders.confirmReturnDescription" }
    return { title: "orders.confirmStatusTitle", desc: "orders.confirmStatusDescription" }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {primaryStatuses.map((s) => {
        const config = actionConfig[s]
        if (!config) return null
        const Icon = config.icon
        const dialog = getDialogText(s)

        return (
          <AlertDialog key={s}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={loading !== null}
              >
                <Icon className="mr-1.5 h-4 w-4" />
                {t(config.labelKey)}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t(dialog.title)}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(dialog.desc, { status: t(config.labelKey) })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("discounts.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdate(s)}>
                  {t("orders.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      })}

      {secondaryStatuses.map((s) => {
        const config = actionConfig[s]
        if (!config) return null
        const Icon = config.icon
        const isCancel = s === "canceled"
        const dialog = getDialogText(s)

        return (
          <AlertDialog key={s}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading !== null}
                className={
                  isCancel
                    ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    : "border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                }
              >
                <Icon className="mr-1.5 h-4 w-4" />
                {t(config.labelKey)}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t(dialog.title)}</AlertDialogTitle>
                <AlertDialogDescription>{t(dialog.desc)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("discounts.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleUpdate(s)}
                  className={isCancel ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
                >
                  {t(config.labelKey)}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      })}
    </div>
  )
}
