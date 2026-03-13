import en from "./locales/en.json"
import fr from "./locales/fr.json"
import ar from "./locales/ar.json"
import es from "./locales/es.json"
import pt from "./locales/pt.json"
import de from "./locales/de.json"
import it from "./locales/it.json"
import nl from "./locales/nl.json"
import tr from "./locales/tr.json"
import ru from "./locales/ru.json"
import zh from "./locales/zh.json"
import ja from "./locales/ja.json"
import ko from "./locales/ko.json"
import hi from "./locales/hi.json"
import id from "./locales/id.json"
import ms from "./locales/ms.json"
import pl from "./locales/pl.json"
import sv from "./locales/sv.json"
import th from "./locales/th.json"
import vi from "./locales/vi.json"

const translations: Record<string, Record<string, unknown>> = {
  en, fr, ar, es, pt, de, it, nl, tr, ru, zh, ja, ko, hi, id, ms, pl, sv, th, vi,
}

export function getT(lang: string) {
  const dict = translations[lang] || translations.en
  const fallback = translations.en
  return (key: string, valuesOrFallback?: Record<string, string> | string) => {
    const values = typeof valuesOrFallback === "object" ? valuesOrFallback : undefined
    const fallbackStr = typeof valuesOrFallback === "string" ? valuesOrFallback : undefined
    const parts = key.split(".")
    let val: unknown = dict
    for (const p of parts) {
      val = (val as Record<string, unknown>)?.[p]
    }
    // Fallback to English if key not found in target language
    if (typeof val !== "string") {
      val = fallback as unknown
      for (const p of parts) {
        val = (val as Record<string, unknown>)?.[p]
      }
    }
    if (typeof val !== "string") return fallbackStr ?? key
    if (values) {
      return Object.entries(values).reduce(
        (str, [k, v]) => str.replace(new RegExp(`{{${k}}}`, "g"), v),
        val
      )
    }
    return val
  }
}
