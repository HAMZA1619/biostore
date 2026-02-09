"use client"

import { useTranslation } from "react-i18next"
import { useLanguageStore, type Language } from "@/lib/store/language-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import "@/lib/i18n"

const LANGUAGE_CODES: Language[] = ["en", "fr", "ar"]

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()

  function handleChange(value: string) {
    const lang = value as Language
    setLanguage(lang)
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }

  return (
    <Select value={language} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[120px] border-transparent bg-transparent px-2 text-sm hover:bg-muted/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGE_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {t(`language.${code}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
