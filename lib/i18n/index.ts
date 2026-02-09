import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import fr from "./locales/fr.json"
import ar from "./locales/ar.json"

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

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: getStoredLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
