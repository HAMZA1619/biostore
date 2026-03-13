"use client"

import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"
import i18n, { loadLocale } from "@/lib/i18n"
import { useLanguageStore } from "@/lib/store/language-store"

export function I18nProvider({ children, overrideLang }: { children: React.ReactNode; overrideLang?: string }) {
  const storeLanguage = useLanguageStore((s) => s.language)
  const language = overrideLang || storeLanguage

  useEffect(() => {
    loadLocale(language).then(() => {
      i18n.changeLanguage(language)
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
      document.documentElement.lang = language
    })
  }, [language])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
