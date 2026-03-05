"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { T } from "@/components/dashboard/translated-text"
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
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { SubscriptionAccess } from "@/lib/subscription"

export function BillingSection({ access }: { access: SubscriptionAccess }) {
  const [loading, setLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    setCanceling(true)
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" })
      if (res.ok) {
        toast.success("Subscription canceled")
        router.refresh()
      } else {
        toast.error("Failed to cancel subscription")
      }
    } finally {
      setCanceling(false)
    }
  }

  const statusColor = {
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    trialing: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    past_due: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    canceled: "bg-gray-50 text-gray-500 dark:bg-gray-900/40 dark:text-gray-400",
    expired: "bg-gray-50 text-gray-500 dark:bg-gray-900/40 dark:text-gray-400",
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground"><T k="billing.title" /></h2>
      <div className="divide-y rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground"><T k="billing.status" /></span>
          <Badge variant="secondary" className={statusColor[access.status]}>
            <T k={`billing.status_${access.status}`} />
          </Badge>
        </div>

        {access.status === "trialing" && access.trialDaysLeft !== null && (
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground"><T k="billing.trialDaysLeft" /></span>
            <span className="font-medium">{access.trialDaysLeft}</span>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground"><T k="billing.plan" /></span>
          <span className="font-medium">
            {access.status === "active" || access.status === "past_due" || access.status === "canceled" ? "Pro" : "—"}
          </span>
        </div>
      </div>

      {access.status !== "active" && access.status !== "canceled" && (
        <Button onClick={handleSubscribe} disabled={loading} className="w-full">
          {loading ? <T k="billing.subscribing" /> : <T k="billing.subscribe" />}
        </Button>
      )}

      {access.status === "active" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <T k="billing.cancelSubscription" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle><T k="billing.cancelTitle" /></AlertDialogTitle>
              <AlertDialogDescription>
                <T k="billing.cancelDescription" />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <T k="billing.cancelNoRefund" />
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel><T k="billing.cancelKeep" /></AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={canceling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {canceling ? <T k="billing.canceling" /> : <T k="billing.cancelConfirm" />}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  )
}
