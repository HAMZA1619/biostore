import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import urlJoin from "url-join"
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
  return urlJoin(process.env.NEXT_PUBLIC_SUPABASE_URL!, "storage/v1/object/public/product-images", storagePath)
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const BLOCKED_HOSTS = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|\[::1?\])$/i

export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    if (BLOCKED_HOSTS.test(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

export function sanitizeCss(css: string): string {
  return css
    .replace(/<[^>]*>/g, "")
    .replace(/@import\b[^;]*/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding\s*:/gi, "")
    .replace(/url\s*\(\s*["']?\s*data\s*:/gi, "url(/* blocked */")
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
    requireCaptcha: typeof raw.requireCaptcha === "boolean" ? raw.requireCaptcha : true,
    whatsappFloat: (raw.whatsappFloat as string) || "",
    mobileOnly: typeof raw.mobileOnly === "boolean" ? raw.mobileOnly : true,
  }
}
