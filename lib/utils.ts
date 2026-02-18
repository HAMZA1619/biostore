import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCIES } from "@/lib/constants"
import type { DesignState } from "@/components/dashboard/design-preview"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string) {
  return `${price.toFixed(2)} ${currency}`
}

export function getCurrencySymbol(currency: string) {
  const c = CURRENCIES.find((cur) => cur.code === currency)
  return c?.symbol || currency
}

export function formatPriceSymbol(price: number, currency: string) {
  return `${getCurrencySymbol(currency)} ${price.toFixed(2)}`
}

export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const d = typeof date === "string" ? new Date(date).getTime() : date.getTime()
  const seconds = Math.floor((now - d) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null
  if (storagePath.startsWith("http")) return storagePath
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`
}

export function parseDesignSettings(raw: Record<string, unknown> = {}): DesignState {
  return {
    logoPath: (raw.logoPath as string) || (raw.logoUrl as string) || null,
    bannerPath: (raw.bannerPath as string) || (raw.bannerUrl as string) || null,
    primaryColor: (raw.primaryColor as string) || "#000000",
    accentColor: (raw.accentColor as string) || "#3B82F6",
    backgroundColor: (raw.backgroundColor as string) || "#ffffff",
    textColor: (raw.textColor as string) || "#111111",
    buttonTextColor: (raw.buttonTextColor as string) || "#ffffff",
    fontFamily: (raw.fontFamily as string) || "Inter",
    borderRadius: (raw.borderRadius as DesignState["borderRadius"]) || "md",
    theme: (raw.theme as DesignState["theme"]) || "default",
    buttonStyle: (raw.buttonStyle as DesignState["buttonStyle"]) || "filled",
    cardShadow: (raw.cardShadow as DesignState["cardShadow"]) || "none",
    headingFont: (raw.headingFont as string) || null,
    productImageRatio: (raw.productImageRatio as DesignState["productImageRatio"]) || "square",
    layoutSpacing: (raw.layoutSpacing as DesignState["layoutSpacing"]) || "normal",
    customCss: (raw.customCss as string) || "",
    language: (raw.language as DesignState["language"]) || "en",
    showBranding: typeof raw.showBranding === "boolean" ? raw.showBranding : true,
    showFloatingCart: typeof raw.showFloatingCart === "boolean" ? raw.showFloatingCart : true,
    showSearch: typeof raw.showSearch === "boolean" ? raw.showSearch : true,
    checkoutShowEmail: typeof raw.checkoutShowEmail === "boolean" ? raw.checkoutShowEmail : true,
    checkoutShowCountry: typeof raw.checkoutShowCountry === "boolean" ? raw.checkoutShowCountry : true,
    checkoutShowCity: typeof raw.checkoutShowCity === "boolean" ? raw.checkoutShowCity : true,
    checkoutShowNote: typeof raw.checkoutShowNote === "boolean" ? raw.checkoutShowNote : true,
    thankYouMessage: (raw.thankYouMessage as string) || "",
    // Layout extras
    cardHoverEffect: (raw.cardHoverEffect as DesignState["cardHoverEffect"]) || "none",
    productInfoAlign: (raw.productInfoAlign as DesignState["productInfoAlign"]) || "start",
    // Header
    announcementText: (raw.announcementText as string) || "",
    announcementLink: (raw.announcementLink as string) || "",
    stickyHeader: typeof raw.stickyHeader === "boolean" ? raw.stickyHeader : true,
    // Footer
    socialInstagram: (raw.socialInstagram as string) || "",
    socialTiktok: (raw.socialTiktok as string) || "",
    socialFacebook: (raw.socialFacebook as string) || "",
    socialWhatsapp: (raw.socialWhatsapp as string) || "",
    // Preferences
    showCardAddToCart: typeof raw.showCardAddToCart === "boolean" ? raw.showCardAddToCart : true,
    whatsappFloat: (raw.whatsappFloat as string) || "",
  }
}
