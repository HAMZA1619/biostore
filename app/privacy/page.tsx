"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { BiostoreLogo } from "@/components/icons/biostore-logo"
import "@/lib/i18n"

export default function PrivacyPage() {
  return (
    <I18nProvider>
      <PrivacyContent />
      <LanguageSwitcher />
    </I18nProvider>
  )
}

function PrivacyContent() {
  const { t } = useTranslation()

  const sections = [
    { title: t("privacy.collectTitle"), text: t("privacy.collectText") },
    { title: t("privacy.useTitle"), text: t("privacy.useText") },
    { title: t("privacy.sharingTitle"), text: t("privacy.sharingText") },
    { title: t("privacy.cookiesTitle"), text: t("privacy.cookiesText") },
    { title: t("privacy.securityTitle"), text: t("privacy.securityText") },
    { title: t("privacy.rightsTitle"), text: t("privacy.rightsText") },
    { title: t("privacy.contactTitle"), text: t("privacy.contactText") },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <BiostoreLogo className="h-7" />
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("landing.signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">{t("landing.getStarted")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("landing.footer")}
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{t("privacy.title")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
        <p className="mb-8 text-muted-foreground">{t("privacy.intro")}</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 text-xl font-semibold">{section.title}</h2>
              <p className="text-muted-foreground">{section.text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>{t("landing.footer")}</p>
      </footer>
    </div>
  )
}
