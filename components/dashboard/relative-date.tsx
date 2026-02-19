"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const localeMap: Record<string, string> = { en: "en-US", ar: "ar-SA", fr: "fr-FR" }

function localizedTimeAgo(date: string | Date, t: (key: string, opts?: Record<string, string | number>) => string): string {
  const now = Date.now()
  const d = typeof date === "string" ? new Date(date).getTime() : date.getTime()
  const seconds = Math.floor((now - d) / 1000)

  if (seconds < 60) return t("timeAgo.justNow")
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t("timeAgo.minutes", { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("timeAgo.hours", { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t("timeAgo.days", { count: days })
  const months = Math.floor(days / 30)
  if (months < 12) return t("timeAgo.months", { count: months })
  const years = Math.floor(months / 12)
  return t("timeAgo.years", { count: years })
}

export function RelativeDate({ date }: { date: string }) {
  const { t, i18n } = useTranslation()
  const locale = localeMap[i18n.language] || i18n.language
  const full = new Date(date).toLocaleString(locale)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger className="text-sm text-muted-foreground">
          {localizedTimeAgo(date, t)}
        </TooltipTrigger>
        <TooltipContent>
          <p>{full}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
