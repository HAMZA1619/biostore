import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { StoreHeader } from "@/components/layout/store-header"
import { StoreFooter } from "@/components/layout/store-footer"
import { FloatingCartButton } from "@/components/store/floating-cart-button"
import { StorefrontI18nProvider } from "@/components/store/storefront-i18n-provider"
import { TrackingScripts } from "@/components/store/tracking-scripts"
import { parseDesignSettings, getImageUrl } from "@/lib/utils"
import { BORDER_RADIUS_OPTIONS, CARD_SHADOW_OPTIONS, PRODUCT_IMAGE_RATIO_OPTIONS, LAYOUT_SPACING_OPTIONS } from "@/lib/constants"
import { getStoreBySlug, getStoreIntegration, getStoreOwnerAccess } from "@/lib/storefront/cache"
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

  const store = await getStoreBySlug(slug, "id, name, slug, language, currency, design_settings, ga_measurement_id")

  if (!store) notFound()

  const ownerHasAccess = await getStoreOwnerAccess(store.id)

  if (!ownerHasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Store Unavailable</h1>
          <p className="text-muted-foreground text-sm">This store is temporarily unavailable. Please check back later.</p>
        </div>
      </div>
    )
  }

  const metaCapi = await getStoreIntegration(store.id, "meta-capi")

  const fbPixelId = (metaCapi?.config as Record<string, unknown>)?.pixel_id as string | undefined

  const headersList = await headers()
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

  return (
    <div
      className="min-h-screen"
      dir={isRtl ? "rtl" : "ltr"}
      lang={storeLang}
      data-base-href={baseHref}
      data-currency={store.currency || "MAD"}
      data-theme={ds.theme}
      data-button-style={ds.buttonStyle}
      data-show-email={ds.checkoutShowEmail}
      data-show-country={ds.checkoutShowCountry}
      data-show-city={ds.checkoutShowCity}
      data-show-note={ds.checkoutShowNote}
      data-thank-you-message={ds.thankYouMessage}
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
        :root {
          --background: ${bg};
          --foreground: ${text};
          --card: ${bg};
          --card-foreground: ${text};
          --popover: ${bg};
          --popover-foreground: ${text};
          --primary: ${primary};
          --primary-foreground: ${btnText};
          --secondary: color-mix(in srgb, ${bg} 90%, ${text});
          --secondary-foreground: ${text};
          --muted: color-mix(in srgb, ${bg} 90%, ${text});
          --muted-foreground: color-mix(in srgb, ${text} 50%, ${bg});
          --accent: color-mix(in srgb, ${bg} 85%, ${primary});
          --accent-foreground: ${text};
          --border: color-mix(in srgb, ${text} 15%, ${bg});
          --input: color-mix(in srgb, ${text} 15%, ${bg});
          --ring: ${primary};
        }
      `}} />
      <link rel="stylesheet" href={fontHref} />
      {ds.customCss && (
        <style dangerouslySetInnerHTML={{ __html: ds.customCss.replace(/<\/style>/gi, "").replace(/<script/gi, "") }} />
      )}
      <TrackingScripts gaId={store.ga_measurement_id} fbPixelId={fbPixelId} />
      <StorefrontI18nProvider lang={storeLang}>
        <StoreHeader slug={store.slug} name={store.name} logoPath={ds.logoPath} bannerPath={ds.bannerPath} />
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
        <StoreFooter storeName={store.name} />
        {ds.showFloatingCart && <FloatingCartButton />}
      </StorefrontI18nProvider>
    </div>
  )
}
