"use client"

import Link from "next/link"
import { AlertTriangle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface UpgradeBannerProps {
  resource: string
  current: number
  limit: number
  variant?: "blocked" | "warning"
}

export function UpgradeBanner({ resource, current, limit, variant = "blocked" }: UpgradeBannerProps) {
  const { t } = useTranslation()
  const label = resource.replace(/_/g, " ")

  if (variant === "warning") {
    const remaining = limit - current
    if (remaining > 3) return null

    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          {t("limits.warningMessage", { remaining, resource: label, current, limit })}{" "}
          <Link href="/dashboard/settings" className="font-medium underline underline-offset-2">
            {t("limits.upgradeLink")}
          </Link>
        </span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("limits.blockedTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("limits.blockedDescription", { limit, resource: label })}
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard/settings">{t("limits.upgradeToPro")}</Link>
      </Button>
    </div>
  )
}
