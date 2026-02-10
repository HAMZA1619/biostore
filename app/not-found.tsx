"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { useTranslation } from "react-i18next"
import { FileQuestion } from "lucide-react"
import "@/lib/i18n"

export default function NotFound() {
  return (
    <I18nProvider>
      <NotFoundContent />
      <LanguageSwitcher />
    </I18nProvider>
  )
}

function NotFoundContent() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center text-center">
      <div>
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-bold">{t("dashboard.notFoundTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("dashboard.notFoundDescription")}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">{t("dashboard.goToDashboard")}</Link>
        </Button>
      </div>
    </div>
  )
}
