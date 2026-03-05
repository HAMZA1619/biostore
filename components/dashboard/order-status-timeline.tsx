"use client"

import { Check, Circle, X, RotateCcw } from "lucide-react"
import { ORDER_STATUS_STEPS, type OrderStatus } from "@/lib/constants"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { cn } from "@/lib/utils"

const statusLabelKeys: Record<string, string> = {
  pending: "orders.statusPending",
  confirmed: "orders.statusConfirmed",
  shipped: "orders.statusShipped",
  delivered: "orders.statusDelivered",
  returned: "orders.statusReturned",
  canceled: "orders.statusCanceled",
}

function getStepIndex(status: OrderStatus): number {
  return ORDER_STATUS_STEPS.indexOf(status)
}

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  const currentIndex = getStepIndex(status)
  const isOffPath = status === "canceled" || status === "returned"

  // For off-path statuses, find the last completed step
  // canceled from pending = 0, canceled from confirmed = 1
  // returned from shipped = 2
  const lastCompletedIndex = isOffPath
    ? status === "returned" ? 2 : Math.max(currentIndex, 0)
    : currentIndex

  return (
    <div className="w-full">
      {/* Timeline steps */}
      <div className="flex items-center">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const stepIndex = index
          let state: "completed" | "current" | "upcoming"

          if (isOffPath) {
            state = stepIndex < lastCompletedIndex ? "completed" : "upcoming"
          } else {
            if (stepIndex < currentIndex) state = "completed"
            else if (stepIndex === currentIndex) state = "current"
            else state = "upcoming"
          }

          return (
            <div key={step} className="flex flex-1 items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors sm:h-9 sm:w-9",
                    state === "completed" && "border-emerald-400 bg-emerald-400 text-white",
                    state === "current" && "border-sky-400 bg-sky-50 text-sky-600 ring-4 ring-sky-100 dark:bg-sky-950 dark:text-sky-400 dark:ring-sky-900/40",
                    state === "upcoming" && "border-muted-foreground/25 bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  {state === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium sm:text-xs",
                    state === "completed" && "text-emerald-600 dark:text-emerald-400",
                    state === "current" && "text-sky-600 dark:text-sky-400",
                    state === "upcoming" && "text-muted-foreground/50"
                  )}
                >
                  {t(statusLabelKeys[step])}
                </span>
              </div>

              {/* Connector line */}
              {index < ORDER_STATUS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 sm:mx-2",
                    stepIndex < (isOffPath ? lastCompletedIndex : currentIndex)
                      ? "bg-emerald-400"
                      : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Off-path status badge */}
      {isOffPath && (
        <div className="mt-3 flex items-center justify-center">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              status === "canceled" && "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
              status === "returned" && "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
            )}
          >
            {status === "canceled" ? (
              <X className="h-3 w-3" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            {t(statusLabelKeys[status])}
          </div>
        </div>
      )}
    </div>
  )
}
