"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { AiChat } from "@/components/dashboard/ai-chat"
import { BiostoreLogo } from "@/components/icons/biostore-logo"
import { useTranslation } from "react-i18next"
import {
  BarChart3,
  Check,
  Globe,
  Languages,
  Layers,
  Link as LinkIcon,
  Palette,
  Puzzle,
  ShoppingCart,
  Smartphone,
  Store,
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
  { icon: Puzzle, titleKey: "landing.featureIntegrations", descKey: "landing.featureIntegrationsDesc" },
  { icon: Globe, titleKey: "landing.featureDomain", descKey: "landing.featureDomainDesc" },
  { icon: Languages, titleKey: "landing.featureLanguage", descKey: "landing.featureLanguageDesc" },
]

const steps = [
  { icon: Store, titleKey: "landing.step1Title", descKey: "landing.step1Desc", step: "1" },
  { icon: LinkIcon, titleKey: "landing.step2Title", descKey: "landing.step2Desc", step: "2" },
  { icon: ShoppingCart, titleKey: "landing.step3Title", descKey: "landing.step3Desc", step: "3" },
]

const pricingFeatures = [
  "landing.pricingFeature1",
  "landing.pricingFeature2",
  "landing.pricingFeature3",
  "landing.pricingFeature4",
  "landing.pricingFeature5",
  "landing.pricingFeature6",
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
        <BiostoreLogo className="h-12" />
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
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center md:py-32">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
          {t("landing.heroTitle")}{" "}
          <span className="text-primary">{t("landing.heroHighlight")}</span>
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          {t("landing.heroDescription")}
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">{t("landing.heroCta")}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("landing.heroTrialNote")}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">
            {t("landing.howItWorksTitle")}
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.titleKey} className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
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

      {/* Pricing */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-3 text-2xl font-bold">{t("landing.pricingTitle")}</h2>
          <p className="mb-10 text-muted-foreground">{t("landing.pricingDescription")}</p>
          <div className="rounded-2xl border bg-background p-8 shadow-sm">
            <div className="mb-6">
              <span className="text-5xl font-bold">{t("landing.pricingPrice")}</span>
              <span className="text-muted-foreground">{t("landing.pricingPeriod")}</span>
            </div>
            <ul className="mb-8 space-y-3 text-start text-sm">
              {pricingFeatures.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="w-full">
              <Link href="/signup">{t("landing.pricingCta")}</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("landing.pricingTrialNote")}
            </p>
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
