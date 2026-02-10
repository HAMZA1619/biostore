"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-16 w-16 text-muted-foreground/40" />
      <h1 className="mt-4 text-2xl font-bold">{t("dashboard.errorTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("dashboard.errorDescription")}</p>
      <Button variant="outline" className="mt-6" onClick={reset}>
        {t("dashboard.tryAgain")}
      </Button>
    </div>
  )
}
