"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLanguageStore, type Language } from "@/lib/store/language-store"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Languages, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/lib/i18n"

const LANGUAGE_CODES: Language[] = ["en", "fr", "ar"]

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()
  const [open, setOpen] = useState(false)

  function handleChange(lang: Language) {
    setLanguage(lang)
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
    setOpen(false)
  }

  return (
    <div className="fixed bottom-4 start-4 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted"
          >
            <Languages className="h-4 w-4" />
            {t(`language.${language}`)}
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-40 p-1">
          {LANGUAGE_CODES.map((code) => (
            <button
              key={code}
              onClick={() => handleChange(code)}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted",
                language === code && "font-medium"
              )}
            >
              {t(`language.${code}`)}
              {language === code && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
