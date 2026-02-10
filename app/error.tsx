"use client"

import { Button } from "@/components/ui/button"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { useTranslation } from "react-i18next"
import { AlertTriangle } from "lucide-react"
import "@/lib/i18n"

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <I18nProvider>
      <ErrorContent reset={reset} />
      <LanguageSwitcher />
    </I18nProvider>
  )
}

function ErrorContent({ reset }: { reset: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center text-center">
      <div>
        <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-bold">{t("dashboard.errorTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("dashboard.errorDescription")}</p>
        <Button variant="outline" className="mt-6" onClick={reset}>
          {t("dashboard.tryAgain")}
        </Button>
      </div>
    </div>
  )
}
