"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState, type ReactNode } from "react"

const LanguageSwitcher = dynamic(
  () => import("@/components/dashboard/language-switcher").then((m) => m.LanguageSwitcher),
  { ssr: false }
)
import { I18nProvider } from "@/components/dashboard/i18n-provider"
import { BiostoreLogo } from "@/components/icons/biostore-logo"
import { useTranslation } from "react-i18next"
import {
  BarChart3,
  Check,
  Coins,
  FolderOpen,
  Globe,
  Languages,
  LayoutDashboard,
  Layers,
  Link as LinkIcon,
  Package,
  Paintbrush,
  Palette,
  Puzzle,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Ticket,
  TrendingUp,
  Zap,
} from "lucide-react"
import "@/lib/i18n"

function FadeIn({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

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

const faqItems = [
  { qKey: "landing.faq1Question", aKey: "landing.faq1Answer" },
  { qKey: "landing.faq2Question", aKey: "landing.faq2Answer" },
  { qKey: "landing.faq3Question", aKey: "landing.faq3Answer" },
  { qKey: "landing.faq4Question", aKey: "landing.faq4Answer" },
  { qKey: "landing.faq5Question", aKey: "landing.faq5Answer" },
]

export default function LandingPage() {
  return (
    <I18nProvider>
      <LandingContent />
      <LanguageSwitcher />
    </I18nProvider>
  )
}

function LandingContent() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
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
      <section className="relative overflow-hidden px-4 pb-0 pt-16 sm:pt-24 md:pt-32">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -start-24 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute -bottom-24 -end-24 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />
        </div>
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Centered text */}
        <div className="relative mx-auto max-w-3xl text-center">
          <FadeIn>
            <h1 className="text-4xl font-semibold leading-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              {t("landing.heroTitle")}{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{t("landing.heroHighlight")}</span>
            </h1>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-muted-foreground text-balance md:text-xl">
              {t("landing.heroDescription")}
            </p>
          </FadeIn>
          <FadeIn delay={180}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/signup">{t("landing.heroCta")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">{t("landing.heroSecondaryCta")}</a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("landing.heroTrialNote")}
            </p>
          </FadeIn>
        </div>

        {/* Dashboard mockup — wide, perspective tilt, bottom fade */}
        <FadeIn delay={300}>
          <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20" style={{ perspective: "2000px" }}>
            <div
              className="overflow-hidden rounded-t-xl border border-b-0 bg-background shadow-2xl"
              style={{ transform: "rotateX(8deg)", transformOrigin: "center top" }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto flex h-6 max-w-xs flex-1 items-center justify-center rounded-md bg-background px-3 text-[10px] text-muted-foreground">
                  biostore.ma/dashboard
                </div>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="hidden w-48 shrink-0 border-e bg-muted/20 p-3 sm:block">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                      <Store className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-semibold">My Store</span>
                  </div>
                  <nav className="space-y-0.5">
                    {[
                      { icon: LayoutDashboard, label: "Overview", active: true },
                      { icon: Store, label: "Store" },
                      { icon: Paintbrush, label: "Design" },
                      { icon: Package, label: "Products" },
                      { icon: FolderOpen, label: "Collections" },
                      { icon: ShoppingCart, label: "Orders" },
                      { icon: Ticket, label: "Discounts" },
                      { icon: Puzzle, label: "Integrations" },
                      { icon: Settings, label: "Settings" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                          item.active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 sm:p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold sm:text-base">Overview</h3>
                    <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      <span>Jan 20 - Feb 20</span>
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: "Products", value: "24", icon: Package },
                      { label: "Orders", value: "156", icon: ShoppingCart },
                      { label: "Revenue", value: "$4,230", icon: Coins },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border p-2.5 sm:p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</span>
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 sm:h-7 sm:w-7">
                            <stat.icon className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                          </div>
                        </div>
                        <p className="mt-1 text-base font-bold sm:text-xl">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Analytics metric cards */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: "Visitors", value: "2,847", change: "+12%", bars: [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95, 70, 80, 65] },
                      { label: "Orders", value: "156", change: "+8%", bars: [30, 50, 70, 45, 60, 80, 55, 75, 90, 65, 85, 70, 60, 95, 50] },
                      { label: "Sales", value: "$4,230", change: "+23%", bars: [55, 40, 75, 60, 85, 50, 70, 95, 65, 80, 45, 90, 75, 60, 85] },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg border p-2.5 sm:p-3">
                        <p className="text-[10px] text-muted-foreground sm:text-xs">{metric.label}</p>
                        <p className="mt-0.5 text-sm font-bold sm:text-base">{metric.value}</p>
                        <div className="mt-0.5 flex items-center gap-0.5">
                          <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                          <span className="text-[9px] text-emerald-500 sm:text-[10px]">{metric.change}</span>
                        </div>
                        {/* Mini bar chart */}
                        <div className="mt-2 flex items-end gap-[2px]" style={{ height: 36 }}>
                          {metric.bars.map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 min-w-[2px] rounded-t bg-primary/50"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>
        </FadeIn>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t bg-muted/30 px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
                {t("landing.howItWorksTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                {t("landing.howItWorksSubtitle")}
              </p>
            </div>
          </FadeIn>
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.titleKey} delay={i * 50}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(step.titleKey)}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">{t(step.descKey)}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Storefront Preview */}
      <section className="px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
            {/* Phone mockup */}
            <FadeIn>
              <div className="mx-auto w-[280px] md:sticky md:top-24">
                <div className="overflow-hidden rounded-[2.5rem] border-[8px] border-foreground/10 bg-background shadow-2xl">
                  {/* Dynamic island */}
                  <div className="flex justify-center bg-background pb-2 pt-2">
                    <div className="h-6 w-24 rounded-full bg-foreground/10" />
                  </div>
                  {/* Store header */}
                  <div className="flex items-center justify-between border-b px-3 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                        <Store className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary">My Store</span>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-md border">
                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  {/* Storefront content */}
                  <div className="px-3 pb-3 pt-3">
                    {/* Collection tabs */}
                    <div className="mb-3 flex gap-1.5">
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground">All</span>
                      <span className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground">Skincare</span>
                      <span className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground">Makeup</span>
                    </div>
                    {/* Product grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { name: "Sneakers", price: "$99.00", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop" },
                        { name: "Classic Watch", price: "$149.00", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop" },
                        { name: "Headphones", price: "$79.00", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop" },
                        { name: "Sunglasses", price: "$59.00", img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop" },
                      ].map((product) => (
                        <div key={product.name} className="overflow-hidden rounded-lg border">
                          <div className="aspect-square overflow-hidden bg-muted">
                            <img src={product.img} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] font-medium leading-tight">{product.name}</p>
                            <p className="mt-0.5 text-[10px] font-bold text-primary">{product.price}</p>
                            <div className="mt-1.5 flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1">
                              <ShoppingCart className="h-2.5 w-2.5 text-primary-foreground" />
                              <span className="text-[8px] font-medium text-primary-foreground">Add to cart</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Home indicator */}
                  <div className="flex justify-center pb-2">
                    <div className="h-1 w-20 rounded-full bg-foreground/15" />
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Text content */}
            <FadeIn delay={100}>
              <div className="flex flex-col justify-center md:py-12">
                <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
                  {t("landing.previewTitle")}
                </h2>
                <p className="mt-4 text-muted-foreground">
                  {t("landing.previewDescription")}
                </p>
                <ul className="mt-8 space-y-4">
                  {["landing.previewFeature1", "landing.previewFeature2", "landing.previewFeature3"].map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm">{t(key)}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-8 w-fit shadow-lg">
                  <Link href="/signup">{t("landing.heroCta")}</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="mb-16 text-center text-3xl font-semibold text-balance sm:text-4xl md:text-5xl">
              {t("landing.featuresTitle")}
            </h2>
          </FadeIn>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeIn key={feature.titleKey} delay={i * 40}>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <feature.icon className="h-5 w-5 shrink-0 text-primary" />
                    <h3 className="font-semibold">{t(feature.titleKey)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold text-balance sm:text-4xl md:text-5xl">{t("landing.pricingTitle")}</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t("landing.pricingSubtitle")}</p>
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <div className="mx-auto max-w-lg rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-lg font-semibold">{t("landing.pricingEverything")}</h3>
                <span className="rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {t("landing.pricingPopular")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{t("landing.pricingDescription")}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">{t("landing.pricingPrice")}</span>
                <span className="text-sm text-muted-foreground">{t("landing.pricingPeriod")}</span>
              </div>

              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/signup">{t("landing.pricingCta")}</Link>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">{t("landing.pricingTrialNote")}</p>

              <Separator className="my-6" />

              <ul className="space-y-3 text-sm">
                {pricingFeatures.map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-semibold text-balance sm:text-4xl">{t("landing.faqTitle")}</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t("landing.faqSubtitle")}</p>
            </div>
          </FadeIn>
          <div className="divide-y">
            {faqItems.map((faq, i) => (
              <FadeIn key={faq.qKey} delay={i * 50}>
                <div className="py-6">
                  <h3 className="font-semibold">{t(faq.qKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(faq.aKey)}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-primary px-4 py-16 text-primary-foreground sm:py-24 md:py-32">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -end-20 -top-20 h-64 w-64 rounded-full border border-primary-foreground/10" />
          <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full border border-primary-foreground/5" />
          <div className="absolute -bottom-16 -start-16 h-56 w-56 rounded-full border border-primary-foreground/10" />
        </div>
        <FadeIn>
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-balance sm:text-4xl">{t("landing.ctaTitle")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg opacity-90">
              {t("landing.ctaDescription")}
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 shadow-lg">
              <Link href="/signup">{t("landing.ctaCta")}</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-12 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-start">
            <div>
              <BiostoreLogo className="mx-auto h-10 md:mx-0" />
              <p className="mt-2 text-sm text-muted-foreground">{t("landing.footerTagline")}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                {t("landing.privacyPolicy")}
              </Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                {t("landing.termsOfService")}
              </Link>
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-center text-xs text-muted-foreground">
            {t("landing.footerCopyright")}
          </p>
        </div>
      </footer>
    </div>
  )
}
