import en from "./locales/en.json"
import fr from "./locales/fr.json"
import ar from "./locales/ar.json"

const translations: Record<string, Record<string, unknown>> = { en, fr, ar }

export function getT(lang: string) {
  const dict = translations[lang] || translations.en
  return (key: string, values?: Record<string, string>) => {
    const parts = key.split(".")
    let val: unknown = dict
    for (const p of parts) {
      val = (val as Record<string, unknown>)?.[p]
    }
    if (typeof val !== "string") return key
    if (values) {
      return Object.entries(values).reduce(
        (str, [k, v]) => str.replace(new RegExp(`{{${k}}}`, "g"), v),
        val
      )
    }
    return val
  }
}
