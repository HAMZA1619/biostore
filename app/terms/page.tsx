"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { LeadivoLogo } from "@/components/icons/leadivo-logo"
import { Separator } from "@/components/ui/separator"
import "@/lib/i18n"

export default function TermsPage() {
  return (
    <I18nProvider>
      <TermsContent />
      <LanguageSwitcher />
    </I18nProvider>
  )
}

function TermsContent() {
  const { t } = useTranslation()

  const sections = [
    { title: t("terms.accountTitle"), text: t("terms.accountText") },
    { title: t("terms.subscriptionTitle"), text: t("terms.subscriptionText") },
    { title: t("terms.storeTitle"), text: t("terms.storeText") },
    { title: t("terms.buyerTitle"), text: t("terms.buyerText") },
    { title: t("terms.integrationsTitle"), text: t("terms.integrationsText") },
    { title: t("terms.contentTitle"), text: t("terms.contentText") },
    { title: t("terms.prohibitedTitle"), text: t("terms.prohibitedText") },
    { title: t("terms.terminationTitle"), text: t("terms.terminationText") },
    { title: t("terms.liabilityTitle"), text: t("terms.liabilityText") },
    { title: t("terms.changesTitle"), text: t("terms.changesText") },
    { title: t("terms.contactTitle"), text: t("terms.contactText") },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <LeadivoLogo className="h-7" />
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

        <h1 className="mb-2 text-3xl font-bold">{t("terms.title")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{t("terms.lastUpdated")}</p>
        <p className="mb-8 text-muted-foreground">{t("terms.intro")}</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 text-xl font-semibold">{section.title}</h2>
              <p className="text-muted-foreground">{section.text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-4 py-12 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-start">
            <div>
              <LeadivoLogo className="mx-auto h-8 md:mx-0" />
              <p className="mt-2 text-sm text-muted-foreground">{t("landing.footerTagline")}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/docs" className="transition-colors hover:text-foreground">
                {t("docs.title")}
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                {t("landing.privacyPolicy")}
              </Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                {t("landing.termsOfService")}
              </Link>
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-center text-xs text-muted-foreground">
            {t("landing.footerCopyright")}
          </p>
        </div>
      </footer>
    </div>
  )
}
