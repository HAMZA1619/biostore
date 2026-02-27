"use client"

import { useState } from "react"
import { CheckCircle, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { BORDER_RADIUS_OPTIONS, CARD_SHADOW_OPTIONS, PRODUCT_IMAGE_RATIO_OPTIONS, LAYOUT_SPACING_OPTIONS } from "@/lib/constants"
import { cn, getImageUrl, sanitizeCss } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import "@/lib/i18n"

export type PreviewTab = "store" | "checkout" | "thankyou"

export interface DesignState {
  logoPath: string | null
  bannerPath: string | null
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  buttonTextColor: string
  fontFamily: string
  borderRadius: "none" | "sm" | "md" | "lg" | "xl"
  theme: "default" | "modern" | "minimal" | "single"
  buttonStyle: "filled" | "outline" | "pill"
  cardShadow: "none" | "sm" | "md" | "lg"
  headingFont: string | null
  productImageRatio: "square" | "portrait" | "landscape"
  layoutSpacing: "compact" | "normal" | "spacious"
  customCss: string
  language: "en" | "fr" | "ar"
  showBranding: boolean
  showFloatingCart: boolean
  showSearch: boolean
  checkoutShowEmail: boolean
  checkoutShowCountry: boolean
  checkoutShowCity: boolean
  checkoutShowNote: boolean
  thankYouMessage: string
  // Layout extras
  cardHoverEffect: "none" | "lift" | "border"
  productInfoAlign: "start" | "center"
  // Header
  announcementText: string
  announcementLink: string
  stickyHeader: boolean
  // Footer
  socialInstagram: string
  socialTiktok: string
  socialFacebook: string
  socialWhatsapp: string
  // Preferences
  showCardAddToCart: boolean
  requireCaptcha: boolean
  whatsappFloat: string
  mobileOnly: boolean
}

interface DesignPreviewProps {
  state: DesignState
  storeName: string
  storeDescription: string
  currency: string
  previewTab: PreviewTab
  onTabChange: (tab: PreviewTab) => void
}

const RTL_LANGS = new Set(["ar"])

const themeCard: Record<string, string> = {
  default: "border",
  modern: "shadow-md",
  minimal: "border-b",
  single: "border border-current/5",
}

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop", // sneaker
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop", // watch
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop", // headphones
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop", // sunglasses
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=300&h=300&fit=crop", // shoes
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop", // sneaker white
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=300&fit=crop", // perfume
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop", // sunglasses red
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop", // backpack
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop", // home exterior
  "https://images.unsplash.com/photo-1616627561950-9f746e330187?w=300&h=300&fit=crop", // plant pot
  "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=300&fit=crop", // home decor
]

function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pickImages(storeName: string): [string, string] {
  const h = hashCode(storeName)
  const i = h % PREVIEW_IMAGES.length
  const j = (i + 1 + (h >> 4) % (PREVIEW_IMAGES.length - 1)) % PREVIEW_IMAGES.length
  return [PREVIEW_IMAGES[i], PREVIEW_IMAGES[j]]
}

const DEFAULT_THANK_YOU = "Thank you for your order! We've received it and will confirm it shortly."

function scopeCss(css: string, scope: string): string {
  const sanitized = sanitizeCss(css)
  // Prefix every selector with the scope class
  // Matches: selector { ... } blocks, handling commas and nested braces
  return sanitized.replace(
    /([^{}]+)\{/g,
    (_, selectors: string) => {
      const scoped = selectors
        .split(",")
        .map((s: string) => {
          const trimmed = s.trim()
          if (!trimmed) return s
          // Skip @-rules like @media, @keyframes
          if (trimmed.startsWith("@")) return s
          return `${scope} ${trimmed}`
        })
        .join(", ")
      return `${scoped} {`
    }
  )
}

function getRadiusCss(radius: string) {
  return BORDER_RADIUS_OPTIONS.find((r) => r.value === radius)?.css || "8px"
}

function getShadowCss(shadow: string) {
  return CARD_SHADOW_OPTIONS.find((s) => s.value === shadow)?.css || "none"
}

function getImageRatioCss(ratio: string) {
  return PRODUCT_IMAGE_RATIO_OPTIONS.find((r) => r.value === ratio)?.css || "1/1"
}

function getSpacing(spacing: string) {
  return LAYOUT_SPACING_OPTIONS.find((s) => s.value === spacing) || LAYOUT_SPACING_OPTIONS[1]
}

const tabs: { value: PreviewTab; labelKey: string }[] = [
  { value: "store", labelKey: "designPreview.tabStore" },
  { value: "checkout", labelKey: "designPreview.tabCheckout" },
  { value: "thankyou", labelKey: "designPreview.tabThankYou" },
]

export function DesignPreview({ state, storeName, storeDescription, currency, previewTab, onTabChange }: DesignPreviewProps) {
  const { t, i18n } = useTranslation()
  const st = i18n.getFixedT(state.language)
  const radiusCss = getRadiusCss(state.borderRadius)
  const isRtl = RTL_LANGS.has(state.language)

  const [cart, setCart] = useState<Record<string, PreviewCartItem>>({})

  function addToCart(name: string, price: number) {
    setCart((prev) => ({
      ...prev,
      [name]: prev[name]
        ? { ...prev[name], qty: prev[name].qty + 1 }
        : { name, price, qty: 1 },
    }))
  }

  function updateQty(name: string, delta: number) {
    setCart((prev) => {
      const item = prev[name]
      if (!item) return prev
      const newQty = item.qty + delta
      if (newQty <= 0) {
        const { [name]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [name]: { ...item, qty: newQty } }
    })
  }

  function removeItem(name: string) {
    setCart((prev) => {
      const { [name]: _, ...rest } = prev
      return rest
    })
  }

  const cartItems = Object.values(cart)
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <div className="mx-auto w-[320px]">
      {/* Tab switcher */}
      <div className="mb-3 flex items-center justify-center gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              previewTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="rounded-[2.5rem] border-[3px] border-gray-900 bg-white p-1.5 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-0.5 h-4 w-20 rounded-full bg-gray-900" />

        {/* Screen */}
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="store-preview-scope h-[580px] overflow-y-auto rounded-[2rem] p-1.5"
          style={
            {
              "--store-primary": state.primaryColor,
              "--store-accent": state.accentColor,
              "--store-bg": state.backgroundColor,
              "--store-text": state.textColor,
              "--store-btn-text": state.buttonTextColor,
              "--store-radius": radiusCss,
              "--store-font": `'${state.fontFamily}', sans-serif`,
              "--store-heading-font": state.headingFont ? `'${state.headingFont}', sans-serif` : `'${state.fontFamily}', sans-serif`,
              "--store-card-shadow": getShadowCss(state.cardShadow),
              "--store-image-ratio": getImageRatioCss(state.productImageRatio),
              "--store-grid-gap": getSpacing(state.layoutSpacing).gap,
              "--store-card-padding": getSpacing(state.layoutSpacing).padding,
              backgroundColor: state.backgroundColor,
              color: state.textColor,
              fontFamily: `'${state.fontFamily}', sans-serif`,
            } as React.CSSProperties
          }
        >
          {state.customCss && (
            <style dangerouslySetInnerHTML={{ __html: scopeCss(state.customCss, ".store-preview-scope") }} />
          )}
          {previewTab === "store" && (
            <StorePreview
              state={state}
              storeName={storeName}
              storeDescription={storeDescription}
              currency={currency}
              radiusCss={radiusCss}
              st={st}
              cartCount={itemCount}
              cartTotal={cartTotal}
              onAddToCart={addToCart}
              onGoToCheckout={() => onTabChange("checkout")}
            />
          )}
          {previewTab === "checkout" && (
            <CheckoutPreview
              state={state}
              storeName={storeName}
              currency={currency}
              radiusCss={radiusCss}
              st={st}
              cartItems={cartItems}
              cartTotal={cartTotal}
              onUpdateQty={updateQty}
              onRemoveItem={removeItem}
              onGoToStore={() => onTabChange("store")}
              onPlaceOrder={() => onTabChange("thankyou")}
            />
          )}
          {previewTab === "thankyou" && (
            <ThankYouPreview state={state} storeName={storeName} radiusCss={radiusCss} st={st} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Store tab ── */

interface PreviewCartItem {
  name: string
  price: number
  qty: number
}

function StorePreview({
  state,
  storeName,
  storeDescription,
  currency,
  radiusCss,
  st,
  cartCount,
  cartTotal,
  onAddToCart,
  onGoToCheckout,
}: {
  state: DesignState
  storeName: string
  storeDescription: string
  currency: string
  radiusCss: string
  st: TFunction
  cartCount: number
  cartTotal: number
  onAddToCart: (name: string, price: number) => void
  onGoToCheckout: () => void
}) {
  const [img1, img2] = pickImages(storeName)

  const gridCols = state.theme === "single" ? "grid-cols-1" : "grid-cols-2"

  return (
    <>
      {state.announcementText && (
        <div className="px-1.5 py-1 text-center text-[8px] font-medium" style={{ backgroundColor: "var(--store-accent)", color: state.buttonTextColor }}>
          {state.announcementText}
        </div>
      )}
      <PreviewHeader state={state} storeName={storeName} cartCount={cartCount} onCartClick={onGoToCheckout} />
      {state.bannerPath && (
        <div className="relative px-2 pt-2">
          <img src={getImageUrl(state.bannerPath)!} alt="" className="w-full" style={{ borderRadius: radiusCss }} />
        </div>
      )}
      <main className="p-2">
        {storeDescription && (
          <p className="mb-1.5 text-[8px] leading-relaxed opacity-50">{storeDescription}</p>
        )}
        {state.showSearch && (
          <div className="relative mb-1.5">
            <div className="flex h-6 w-full items-center rounded-md border border-current/10 bg-current/5 ps-6 text-[8px] opacity-50" style={{ borderRadius: radiusCss }}>
              {st("search.searchProducts")}
            </div>
            <svg className="absolute start-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 opacity-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        )}
        <div className={cn("product-grid grid", gridCols)} style={{ gap: getSpacing(state.layoutSpacing).gap }}>
          <PreviewProductCard state={state} name={st("designPreview.sampleProduct")} price={99} currency={currency} radiusCss={radiusCss} st={st} onAdd={onAddToCart} imageUrl={img1} />
          <PreviewProductCard state={state} name={st("designPreview.anotherItem")} price={149} currency={currency} radiusCss={radiusCss} st={st} onAdd={onAddToCart} imageUrl={img2} />
        </div>
      </main>
      <div className="border-t px-2 py-2 text-center text-[10px] opacity-50">
        <p>&copy; {new Date().getFullYear()} {storeName}</p>
        {(state.socialInstagram || state.socialTiktok || state.socialFacebook || state.socialWhatsapp) && (
          <div className="mt-1 flex items-center justify-center gap-2">
            {state.socialInstagram && <div className="h-2.5 w-2.5 rounded-full bg-current opacity-40" />}
            {state.socialTiktok && <div className="h-2.5 w-2.5 rounded-full bg-current opacity-40" />}
            {state.socialFacebook && <div className="h-2.5 w-2.5 rounded-full bg-current opacity-40" />}
            {state.socialWhatsapp && <div className="h-2.5 w-2.5 rounded-full bg-current opacity-40" />}
          </div>
        )}
      </div>

      {state.showFloatingCart && cartCount > 0 && (
        <div className="sticky bottom-1.5 mx-2">
          <button
            type="button"
            onClick={onGoToCheckout}
            className="animate-[subtle-bounce_5s_ease-in-out_infinite] flex w-full items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] font-medium shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: state.buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
              color: state.buttonStyle === "outline" ? "var(--store-accent)" : state.buttonTextColor,
              borderRadius: state.buttonStyle === "pill" ? "9999px" : radiusCss,
              border: state.buttonStyle === "outline" ? "1.5px solid var(--store-accent)" : "none",
            }}
          >
            <div className="relative">
              <ShoppingCart className="h-3 w-3" />
              <span
                className="absolute -end-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-white text-[7px] font-bold"
                style={{ color: "var(--store-accent)" }}
              >
                {cartCount}
              </span>
            </div>
            <span>{st("designPreview.viewCart")}</span>
            <span className="font-bold">{cartTotal.toFixed(2)} {currency}</span>
          </button>
        </div>
      )}

      {state.whatsappFloat && (
        <div className="sticky bottom-1.5 flex justify-end px-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] shadow-lg">
            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.607-1.476A11.937 11.937 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.186-.581-5.932-1.594l-.424-.253-2.731.876.864-2.655-.278-.44A9.79 9.79 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z"/></svg>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Checkout tab ── */
function CheckoutPreview({
  state,
  storeName,
  currency,
  radiusCss,
  st,
  cartItems,
  cartTotal,
  onUpdateQty,
  onRemoveItem,
  onGoToStore,
  onPlaceOrder,
}: {
  state: DesignState
  storeName: string
  currency: string
  radiusCss: string
  st: TFunction
  cartItems: PreviewCartItem[]
  cartTotal: number
  onUpdateQty: (name: string, delta: number) => void
  onRemoveItem: (name: string) => void
  onGoToStore: () => void
  onPlaceOrder: () => void
}) {
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  return (
    <>
      <PreviewHeader state={state} storeName={storeName} cartCount={itemCount} />
      <div className="p-2 space-y-2">
        {/* Cart summary */}
        {cartItems.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold">{st("designPreview.viewCart")} ({itemCount})</p>
            {cartItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2 border-b pb-2">
                <div className="h-8 w-8 shrink-0 rounded bg-gray-100" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium">{item.name}</p>
                  <p className="text-[10px] font-bold" style={{ color: "var(--store-primary)" }}>
                    {item.price.toFixed(2)} {currency}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.name, -1)}
                    className="flex h-4 w-4 items-center justify-center rounded border text-[8px]"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="w-4 text-center text-[10px] font-medium">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.name, 1)}
                    className="flex h-4 w-4 items-center justify-center rounded border text-[8px]"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.name)}
                    className="ms-1 flex h-4 w-4 items-center justify-center text-red-500"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span>{st("storefront.total")}</span>
              <span>{cartTotal.toFixed(2)} {currency}</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-[10px] opacity-50">{st("storefront.cartEmpty")}</p>
            <button
              type="button"
              onClick={onGoToStore}
              className="mt-2 text-[10px] font-medium underline"
              style={{ color: "var(--store-accent)" }}
            >
              {st("designPreview.continueShopping")}
            </button>
          </div>
        )}

        {cartItems.length > 0 && (
          <>
            <div className="border-t pt-2">
              <p className="text-[10px] font-bold">{st("designPreview.deliveryInformation")}</p>
            </div>

            <PreviewField label={st("designPreview.fullName")} />
            <PreviewField label={st("designPreview.phone")} />

            {state.checkoutShowEmail && <PreviewField label={st("designPreview.email")} />}
            {state.checkoutShowCountry && <PreviewField label={st("designPreview.country")} />}
            {state.checkoutShowCity && <PreviewField label={st("designPreview.city")} />}

            <PreviewField label={st("designPreview.address")} tall />

            {state.checkoutShowNote && <PreviewField label={st("designPreview.noteLabel")} tall />}

            <button
              type="button"
              onClick={onPlaceOrder}
              className="mt-1 w-full py-1.5 text-[9px] font-medium"
              style={{
                backgroundColor: state.buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
                color: state.buttonStyle === "outline" ? "var(--store-accent)" : state.buttonTextColor,
                borderRadius: state.buttonStyle === "pill" ? "9999px" : radiusCss,
                border: state.buttonStyle === "outline" ? "1.5px solid var(--store-accent)" : "none",
              }}
            >
              {st("designPreview.orderNow")}
            </button>
          </>
        )}
      </div>
    </>
  )
}

/* ── Thank you tab ── */
function ThankYouPreview({
  state,
  storeName,
  radiusCss,
  st,
}: {
  state: DesignState
  storeName: string
  radiusCss: string
  st: TFunction
}) {
  const message = state.thankYouMessage || DEFAULT_THANK_YOU

  return (
    <>
      <PreviewHeader state={state} storeName={storeName} />
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--store-accent)", color: state.buttonTextColor }}
        >
          <CheckCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold">{st("designPreview.orderConfirmed")}</p>
        <p className="text-[10px] opacity-60">{st("designPreview.orderNumber")}</p>
        <p className="text-[10px] leading-relaxed opacity-60">{message}</p>
        <button
          type="button"
          className="mt-2 px-4 py-1.5 text-[10px] font-medium"
          style={{
            backgroundColor: "var(--store-accent)",
            color: state.buttonTextColor,
            borderRadius: radiusCss,
          }}
        >
          {st("designPreview.continueShopping")}
        </button>
      </div>
    </>
  )
}

/* ── Shared components ── */
function PreviewHeader({
  state,
  storeName,
  cartCount = 0,
  onCartClick,
}: {
  state: DesignState
  storeName: string
  cartCount?: number
  onCartClick?: () => void
}) {
  return (
    <header
      className={cn("top-0 z-10 border-b backdrop-blur", state.stickyHeader && "sticky")}
      style={{ backgroundColor: `${state.backgroundColor}f2` }}
    >
      <div className="flex h-8 items-center justify-between px-2">
        <div className="flex items-center gap-1">
          {state.logoPath && (
            <img
              src={getImageUrl(state.logoPath)!}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          )}
          <span
            className="text-xs font-bold"
            style={{ color: "var(--store-primary)", fontFamily: "var(--store-heading-font)" }}
          >
            {storeName}
          </span>
        </div>
        <button type="button" className="relative" onClick={onCartClick}>
          <ShoppingCart className="h-3 w-3 opacity-50" />
          {cartCount > 0 && (
            <span
              className="absolute -end-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full text-[6px] font-bold"
              style={{ backgroundColor: "var(--store-accent)", color: state.buttonTextColor }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

function PreviewField({ label, tall }: { label: string; tall?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-medium opacity-70">{label}</p>
      <div
        className={cn(
          "w-full rounded border border-current/10 bg-current/5",
          tall ? "h-8" : "h-5"
        )}
      />
    </div>
  )
}

function PreviewProductCard({
  state,
  name,
  price,
  currency,
  radiusCss,
  st,
  onAdd,
  imageUrl,
}: {
  state: DesignState
  name: string
  price: number
  currency: string
  radiusCss: string
  st: TFunction
  onAdd?: (name: string, price: number) => void
  imageUrl: string
}) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAdd?.(name, price)
    setAdded(true)
    setTimeout(() => setAdded(false), 600)
  }

  const shadowCss = getShadowCss(state.cardShadow)
  const imageRatio = getImageRatioCss(state.productImageRatio)
  const pillRadius = state.buttonStyle === "pill" ? "9999px" : radiusCss
  const isOutline = state.buttonStyle === "outline"

  const hoverClass = state.cardHoverEffect === "lift"
    ? "transition-transform hover:-translate-y-0.5 hover:shadow-md"
    : state.cardHoverEffect === "border"
      ? "transition-colors hover:border-current/30"
      : ""
  const alignCenter = state.productInfoAlign === "center"

  return (
    <div
      className={cn(`store-card overflow-hidden ${themeCard[state.theme]}`, hoverClass)}
      style={{ borderRadius: radiusCss, backgroundColor: state.backgroundColor, boxShadow: shadowCss }}
    >
      <div className="overflow-hidden bg-gray-100" style={{ borderRadius: `${radiusCss} ${radiusCss} 0 0`, aspectRatio: imageRatio }}>
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover grayscale"
        />
      </div>
      <div className={cn("p-1.5", alignCenter && "text-center")}>
        <p className="text-[10px] font-medium leading-tight" style={{ fontFamily: "var(--store-heading-font)" }}>{name}</p>
        <p
          className="mt-0.5 text-[10px] font-bold"
          style={{ color: "var(--store-primary)" }}
        >
          {price.toFixed(2)} {currency}
        </p>
        {state.showCardAddToCart && (
          <button
            type="button"
            onClick={handleAdd}
            className={cn(
              "mt-1 w-full px-1.5 py-0.5 text-[9px] font-medium transition-all",
              added && "scale-95"
            )}
            style={{
              backgroundColor: isOutline ? "transparent" : "var(--store-accent)",
              color: isOutline ? "var(--store-accent)" : state.buttonTextColor,
              borderRadius: pillRadius,
              border: isOutline ? "1.5px solid var(--store-accent)" : "none",
            }}
          >
            {added ? "✓" : st("designPreview.addToCart")}
          </button>
        )}
      </div>
    </div>
  )
}
