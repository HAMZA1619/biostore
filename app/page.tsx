"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { AiChat } from "@/components/dashboard/ai-chat"
import { useTranslation } from "react-i18next"
import {
  BarChart3,
  Globe,
  Languages,
  Layers,
  Megaphone,
  Palette,
  ShoppingCart,
  Smartphone,
  Zap,
} from "lucide-react"
import "@/lib/i18n"

const features = [
  { icon: Zap, titleKey: "landing.featureReady", descKey: "landing.featureReadyDesc" },
  { icon: Smartphone, titleKey: "landing.featureMobile", descKey: "landing.featureMobileDesc" },
  { icon: ShoppingCart, titleKey: "landing.featureCod", descKey: "landing.featureCodDesc" },
  { icon: Palette, titleKey: "landing.featureDesign", descKey: "landing.featureDesignDesc" },
  { icon: Layers, titleKey: "landing.featureCollections", descKey: "landing.featureCollectionsDesc" },
  { icon: BarChart3, titleKey: "landing.featureAnalytics", descKey: "landing.featureAnalyticsDesc" },
  { icon: Megaphone, titleKey: "landing.featureMarketing", descKey: "landing.featureMarketingDesc" },
  { icon: Globe, titleKey: "landing.featureDomain", descKey: "landing.featureDomainDesc" },
  { icon: Languages, titleKey: "landing.featureLanguage", descKey: "landing.featureLanguageDesc" },
]

export default function LandingPage() {
  return (
    <I18nProvider>
      <LandingContent />
      <LanguageSwitcher />
      <AiChat />
    </I18nProvider>
  )
}

function LandingContent() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <span className="text-lg font-bold">BioStore</span>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("landing.signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">{t("landing.getStarted")}</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
          {t("landing.heroTitle")}{" "}
          <span className="text-primary">{t("landing.heroHighlight")}</span>
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          {t("landing.heroDescription")}
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">{t("landing.heroCta")}</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold">
            {t("landing.featuresTitle")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.titleKey} className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>{t("landing.footer")}</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">{t("landing.privacyPolicy")}</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground">{t("landing.termsOfService")}</Link>
        </div>
      </footer>
    </div>
  )
}
