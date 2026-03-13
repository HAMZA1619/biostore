"use client"

import Link from "next/link"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { LeadivoLogo } from "@/components/icons/leadivo-logo"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <BlogShellInner>{children}</BlogShellInner>
    </I18nProvider>
  )
}

function BlogShellInner({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="shrink-0">
            <LeadivoLogo className="h-7" />
          </Link>
          <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("blog.title")}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t px-4 py-8 sm:py-12 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-start">
            <div>
              <LeadivoLogo className="mx-auto h-8 md:mx-0" />
              <p className="mt-2 text-sm text-muted-foreground">{t("landing.footerTagline")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/blog" className="transition-colors hover:text-foreground">
                {t("blog.title")}
              </Link>
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
          <p className="text-center text-xs text-muted-foreground">{t("landing.footerCopyright")}</p>
        </div>
      </footer>
      <LanguageSwitcher />
    </div>
  )
}
