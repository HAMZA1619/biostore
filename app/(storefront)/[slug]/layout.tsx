import { notFound } from "next/navigation"
import { headers, cookies } from "next/headers"
import { StoreHeader } from "@/components/layout/store-header"
import { StoreFooter } from "@/components/layout/store-footer"
import { FloatingCartButton } from "@/components/store/floating-cart-button"
import { StorefrontI18nProvider } from "@/components/store/storefront-i18n-provider"
import { TrackingScripts } from "@/components/store/tracking-scripts"
import { MarketSuggestionBanner } from "@/components/store/market-suggestion-banner"
import { DesktopPhoneFrame } from "@/components/store/desktop-phone-frame"
import { StoreConfigProvider } from "@/lib/store/store-config"
import { cn, parseDesignSettings, getImageUrl, sanitizeCss, isValidHttpUrl } from "@/lib/utils"
import { BORDER_RADIUS_OPTIONS, CARD_SHADOW_OPTIONS, PRODUCT_IMAGE_RATIO_OPTIONS, LAYOUT_SPACING_OPTIONS } from "@/lib/constants"
import { getStoreBySlug, getStoreIntegration, getStoreOwnerAccess, getStoreMarkets } from "@/lib/storefront/cache"
import { detectMarketByCountry } from "@/lib/market/detect-market"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug, "name, description, design_settings")

  if (!store) return {}

  const title = store.name
  const description = store.description || `Shop at ${store.name}`

  const ds = parseDesignSettings((store.design_settings || {}) as Record<string, unknown>)
  const logoUrl = ds.logoPath ? getImageUrl(ds.logoPath) : null

  return {
    title,
    description,
    ...(logoUrl ? { icons: { icon: logoUrl, apple: logoUrl } } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      ...(logoUrl ? { images: [{ url: logoUrl }] } : {}),
    },
    twitter: {
      card: logoUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(logoUrl ? { images: [logoUrl] } : {}),
    },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await getStoreBySlug(slug, "id, name, slug, language, currency, design_settings")

  if (!store) notFound()

  const ownerHasAccess = await getStoreOwnerAccess(store.id)

  if (!ownerHasAccess) {
    const unavailableText: Record<string, { title: string; description: string }> = {
      en: { title: "Store Unavailable", description: "This store is temporarily unavailable. Please check back later." },
      fr: { title: "Boutique indisponible", description: "Cette boutique est temporairement indisponible. Veuillez réessayer plus tard." },
      ar: { title: "المتجر غير متاح", description: "هذا المتجر غير متاح مؤقتاً. يرجى المحاولة لاحقاً." },
    }
    const txt = unavailableText[store.language] || unavailableText.en
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" dir={store.language === "ar" ? "rtl" : "ltr"}>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{txt.title}</h1>
          <p className="text-muted-foreground text-sm">{txt.description}</p>
        </div>
      </div>
    )
  }

  const [metaCapi, tiktokEapi, googleAnalytics] = await Promise.all([
    getStoreIntegration(store.id, "meta-capi"),
    getStoreIntegration(store.id, "tiktok-eapi"),
    getStoreIntegration(store.id, "google-analytics"),
  ])

  const fbPixelId = (metaCapi?.config as Record<string, unknown>)?.pixel_id as string | undefined
  const ttPixelCode = (tiktokEapi?.config as Record<string, unknown>)?.pixel_code as string | undefined
  const gaId = (googleAnalytics?.config as Record<string, unknown>)?.measurement_id as string | undefined

  const markets = await getStoreMarkets(store.id)
  const hasMarkets = markets && markets.length > 0

  const headersList = await headers()
  const cookieStore = await cookies()
  const marketCookie = cookieStore.get("biostore-market")?.value
  const geoCountry = headersList.get("cf-ipcountry") || headersList.get("x-vercel-ip-country") || null

  let activeMarket: (typeof markets extends (infer T)[] | null ? T : never) | null = null
  if (hasMarkets) {
    if (marketCookie) {
      activeMarket = markets.find((m) => m.slug === marketCookie) || null
    }
    if (!activeMarket) {
      activeMarket = markets.find((m) => m.is_default) || null
    }
  }

  let suggestedMarket: typeof activeMarket = null
  if (hasMarkets && geoCountry && !marketCookie) {
    const detected = detectMarketByCountry(markets, geoCountry)
    if (detected && activeMarket && detected.slug !== activeMarket.slug) {
      suggestedMarket = markets.find((m) => m.slug === detected.slug) || null
    } else if (detected && !activeMarket) {
      suggestedMarket = markets.find((m) => m.slug === detected.slug) || null
    }
  }

  const activeCurrency = activeMarket?.currency || store.currency

  const isCustomDomain = headersList.get("x-custom-domain") === "true"
  const baseHref = isCustomDomain ? "" : `/${slug}`

  const ds = parseDesignSettings((store.design_settings || {}) as Record<string, unknown>)
  const storeLang = ds.language || store.language || "en"
  const isRtl = storeLang === "ar"
  const radiusCss = BORDER_RADIUS_OPTIONS.find((r) => r.value === ds.borderRadius)?.css || "8px"
  const shadowCss = CARD_SHADOW_OPTIONS.find((s) => s.value === ds.cardShadow)?.css || "none"
  const imageRatioCss = PRODUCT_IMAGE_RATIO_OPTIONS.find((r) => r.value === ds.productImageRatio)?.css || "1/1"
  const spacing = LAYOUT_SPACING_OPTIONS.find((s) => s.value === ds.layoutSpacing) || LAYOUT_SPACING_OPTIONS[1]
  const fontFamilies = ds.headingFont && ds.headingFont !== ds.fontFamily
    ? `${ds.fontFamily.replace(/ /g, "+")}:wght@400;500;600;700&family=${ds.headingFont.replace(/ /g, "+")}:wght@400;500;600;700`
    : `${ds.fontFamily.replace(/ /g, "+")}:wght@400;500;600;700`
  const fontHref = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`

  const bg = ds.backgroundColor
  const text = ds.textColor
  const primary = ds.primaryColor
  const accent = ds.accentColor
  const btnText = ds.buttonTextColor

  const storeUrl = isCustomDomain
    ? `https://${headersList.get("host") || ""}`
    : `${process.env.NEXT_PUBLIC_APP_URL || ""}/${slug}`

  const storeContent = (content: React.ReactNode) =>
    ds.mobileOnly ? (
      <DesktopPhoneFrame storeName={store.name} logoPath={ds.logoPath} storeUrl={storeUrl}>
        {content}
      </DesktopPhoneFrame>
    ) : content

  return (
    <div
      className="storefront min-h-[100dvh]"
      dir={isRtl ? "rtl" : "ltr"}
      lang={storeLang}
      data-base-href={baseHref}
      data-currency={activeCurrency || store.currency}
      data-market-id={activeMarket?.id || ""}
      data-market-slug={activeMarket?.slug || ""}
      data-theme={ds.theme}
      data-button-style={ds.buttonStyle}
      data-show-email={ds.checkoutShowEmail}
      data-show-country={ds.checkoutShowCountry}
      data-show-city={ds.checkoutShowCity}
      data-show-note={ds.checkoutShowNote}
      data-thank-you-message={ds.thankYouMessage}
      data-card-hover={ds.cardHoverEffect}
      data-product-align={ds.productInfoAlign}
      data-show-card-atc={ds.showCardAddToCart}
      style={
        {
          "--store-primary": primary,
          "--store-accent": accent,
          "--store-bg": bg,
          "--store-text": text,
          "--store-btn-text": btnText,
          "--store-radius": radiusCss,
          "--store-font": `'${ds.fontFamily}', sans-serif`,
          "--store-heading-font": ds.headingFont ? `'${ds.headingFont}', sans-serif` : `'${ds.fontFamily}', sans-serif`,
          "--store-card-shadow": shadowCss,
          "--store-image-ratio": imageRatioCss,
          "--store-grid-gap": spacing.gap,
          "--store-card-padding": spacing.padding,
          "--background": bg,
          "--foreground": text,
          "--card": bg,
          "--card-foreground": text,
          "--popover": bg,
          "--popover-foreground": text,
          "--primary": primary,
          "--primary-foreground": btnText,
          "--secondary": `color-mix(in srgb, ${bg} 90%, ${text})`,
          "--secondary-foreground": text,
          "--muted": `color-mix(in srgb, ${bg} 90%, ${text})`,
          "--muted-foreground": `color-mix(in srgb, ${text} 50%, ${bg})`,
          "--accent": `color-mix(in srgb, ${bg} 85%, ${primary})`,
          "--accent-foreground": text,
          "--border": `color-mix(in srgb, ${text} 15%, ${bg})`,
          "--input": `color-mix(in srgb, ${text} 15%, ${bg})`,
          "--ring": primary,
          backgroundColor: bg,
          color: text,
          fontFamily: `'${ds.fontFamily}', sans-serif`,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .product-grid { container-type: inline-size; }
        .store-card { container-type: inline-size; font-size: clamp(0.8125rem, 4.25cqw, 1rem); }
        .store-card .text-xs { font-size: clamp(0.625rem, 5.5cqw, 0.8125rem); }
        .store-card .text-sm { font-size: clamp(0.72rem, 6.5cqw, 0.9375rem); }
        .store-card button svg { width: 1em; height: 1em; }
      `}} />
      <link rel="stylesheet" href={fontHref} />
      {ds.customCss && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeCss(ds.customCss) }} />
      )}
      <TrackingScripts gaId={gaId} fbPixelId={fbPixelId} ttPixelCode={ttPixelCode} />
      <StoreConfigProvider config={{
        currency: activeCurrency || store.currency,
        buttonStyle: ds.buttonStyle || "filled",
        baseHref,
        market: activeMarket ? { id: activeMarket.id, slug: activeMarket.slug } : null,
        showEmail: ds.checkoutShowEmail !== false,
        showCountry: ds.checkoutShowCountry !== false,
        showCity: ds.checkoutShowCity !== false,
        showNote: ds.checkoutShowNote !== false,
        thankYouMessage: ds.thankYouMessage || "",
        requireCaptcha: ds.requireCaptcha !== false,
      }}>
      <StorefrontI18nProvider lang={storeLang}>
        {storeContent(
          <>
            {ds.announcementText && (
              <div className="text-center text-xs font-medium py-2 px-4 sm:text-sm" style={{ backgroundColor: accent, color: btnText }}>
                {ds.announcementLink && isValidHttpUrl(ds.announcementLink) ? (
                  <a href={ds.announcementLink} className="hover:underline">{ds.announcementText}</a>
                ) : (
                  ds.announcementText
                )}
              </div>
            )}
            {suggestedMarket && (
              <MarketSuggestionBanner
                suggestedMarket={{ slug: suggestedMarket.slug, name: suggestedMarket.name, currency: suggestedMarket.currency }}
                currentMarketSlug={activeMarket?.slug}
              />
            )}
            <StoreHeader
              slug={store.slug}
              name={store.name}
              logoPath={ds.logoPath}
              bannerPath={ds.bannerPath}
              stickyHeader={ds.stickyHeader}
              markets={hasMarkets ? markets.map((m) => ({ slug: m.slug, name: m.name, currency: m.currency })) : undefined}
              activeMarketSlug={activeMarket?.slug}
            />
            <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
            <StoreFooter storeName={store.name} socialInstagram={ds.socialInstagram} socialTiktok={ds.socialTiktok} socialFacebook={ds.socialFacebook} socialWhatsapp={ds.socialWhatsapp} />
            {ds.showFloatingCart && <FloatingCartButton />}
            {ds.whatsappFloat && (
              <a
                href={`https://wa.me/${ds.whatsappFloat.replace(/[^0-9+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("fixed end-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110", ds.showFloatingCart ? "bottom-20" : "bottom-4")}
                aria-label="WhatsApp"
              >
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.607-1.476A11.937 11.937 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.186-.581-5.932-1.594l-.424-.253-2.731.876.864-2.655-.278-.44A9.79 9.79 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z"/></svg>
              </a>
            )}
          </>
        )}
      </StorefrontI18nProvider>
      </StoreConfigProvider>
    </div>
  )
}
