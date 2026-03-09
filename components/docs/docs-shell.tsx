"use client"

import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
            <a href="/" className="text-lg font-bold text-primary">
              Leadivo
            </a>
            <span className="ml-3 text-sm text-muted-foreground">Docs</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <LanguageSwitcher />
      </div>
    </I18nProvider>
  )
}
