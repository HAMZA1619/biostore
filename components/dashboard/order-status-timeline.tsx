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
                    state === "completed" && "border-green-500 bg-green-500 text-white",
                    state === "current" && "border-blue-500 bg-blue-50 text-blue-600 ring-4 ring-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-900/40",
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
                    state === "completed" && "text-green-600 dark:text-green-400",
                    state === "current" && "text-blue-600 dark:text-blue-400",
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
                      ? "bg-green-500"
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
              status === "canceled" && "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400",
              status === "returned" && "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
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
