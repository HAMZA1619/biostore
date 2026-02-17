import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"

function getStoredLanguage(): string {
  if (typeof window === "undefined") return "en"
  try {
    const stored = localStorage.getItem("biostore-lang")
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed?.state?.language || "en"
    }
  } catch {
    // ignore
  }
  return "en"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localeLoaders: Record<string, () => Promise<{ default: any }>> = {
  fr: () => import("./locales/fr.json"),
  ar: () => import("./locales/ar.json"),
}

const initialLang = getStoredLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

if (initialLang !== "en") {
  loadLocale(initialLang).then(() => i18n.changeLanguage(initialLang))
}

export async function loadLocale(lang: string) {
  if (lang === "en" || i18n.hasResourceBundle(lang, "translation")) return
  const loader = localeLoaders[lang]
  if (!loader) return
  const mod = await loader()
  i18n.addResourceBundle(lang, "translation", mod.default)
}

export default i18n
