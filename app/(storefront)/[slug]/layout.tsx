import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { StoreHeader } from "@/components/layout/store-header"
import { StoreFooter } from "@/components/layout/store-footer"
import { FloatingCartButton } from "@/components/store/floating-cart-button"
import { StorefrontI18nProvider } from "@/components/store/storefront-i18n-provider"
import { TrackingScripts } from "@/components/store/tracking-scripts"
import { BORDER_RADIUS_OPTIONS } from "@/lib/constants"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: store } = await supabase
    .from("stores")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) return {}

  return {
    title: store.name,
    description: store.description || `Shop at ${store.name}`,
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
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("name, slug, language, currency, logo_url, banner_url, primary_color, accent_color, background_color, text_color, button_text_color, font_family, border_radius, theme, show_branding, show_floating_cart, show_search, checkout_show_email, checkout_show_country, checkout_show_city, checkout_show_note, thank_you_message, ga_measurement_id, fb_pixel_id")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) notFound()

  const headersList = await headers()
  const isCustomDomain = headersList.get("x-custom-domain") === "true"
  const baseHref = isCustomDomain ? "" : `/${slug}`

  const storeLang = store.language || "en"
  const isRtl = storeLang === "ar"
  const fontFamily = store.font_family || "Inter"
  const radiusCss = BORDER_RADIUS_OPTIONS.find((r) => r.value === (store.border_radius || "md"))?.css || "8px"
  const fontHref = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`

  const bg = store.background_color || "#ffffff"
  const text = store.text_color || "#111111"
  const primary = store.primary_color || "#000000"
  const accent = store.accent_color || "#3B82F6"
  const btnText = store.button_text_color || "#ffffff"

  return (
    <div
      className="min-h-screen"
      dir={isRtl ? "rtl" : "ltr"}
      lang={storeLang}
      data-base-href={baseHref}
      data-currency={store.currency || "MAD"}
      data-theme={store.theme || "default"}
      data-show-email={store.checkout_show_email ?? true}
      data-show-country={store.checkout_show_country ?? true}
      data-show-city={store.checkout_show_city ?? true}
      data-show-note={store.checkout_show_note ?? true}
      data-thank-you-message={store.thank_you_message || ""}
      style={
        {
          "--store-primary": primary,
          "--store-accent": accent,
          "--store-bg": bg,
          "--store-text": text,
          "--store-btn-text": btnText,
          "--store-radius": radiusCss,
          "--store-font": `'${fontFamily}', sans-serif`,
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
          fontFamily: `'${fontFamily}', sans-serif`,
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
      <TrackingScripts gaId={store.ga_measurement_id} fbPixelId={store.fb_pixel_id} />
      <StorefrontI18nProvider lang={storeLang}>
        <StoreHeader slug={store.slug} name={store.name} logoUrl={store.logo_url} bannerUrl={store.banner_url} />
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
        <StoreFooter storeName={store.name} />
        {(store.show_floating_cart ?? true) && <FloatingCartButton />}
      </StorefrontI18nProvider>
    </div>
  )
}
