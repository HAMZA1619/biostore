"use client"

import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const localeMap: Record<string, string> = {
  en: "en-US",
  ar: "ar-SA",
  fr: "fr-FR",
}

interface FormattedDateProps {
  date: string | Date
  options?: Intl.DateTimeFormatOptions
}

const defaultOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
}

export function FormattedDate({ date, options = defaultOptions }: FormattedDateProps) {
  const { i18n } = useTranslation()
  const locale = localeMap[i18n.language] || i18n.language
  return <>{new Date(date).toLocaleDateString(locale, options)}</>
}

export function FormattedDateTime({ date }: { date: string | Date }) {
  const { i18n } = useTranslation()
  const locale = localeMap[i18n.language] || i18n.language
  return (
    <>
      {new Date(date).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}
    </>
  )
}
