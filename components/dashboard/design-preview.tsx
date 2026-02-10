"use client"

import { useState } from "react"
import { CheckCircle, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { BORDER_RADIUS_OPTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import "@/lib/i18n"

export type PreviewTab = "store" | "checkout" | "thankyou"

export interface DesignState {
  logoUrl: string | null
  bannerUrl: string | null
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  buttonTextColor: string
  fontFamily: string
  borderRadius: "none" | "sm" | "md" | "lg" | "xl"
  theme: "default" | "modern" | "minimal" | "single"
  showBranding: boolean
  showFloatingCart: boolean
  showSearch: boolean
  checkoutShowEmail: boolean
  checkoutShowCountry: boolean
  checkoutShowCity: boolean
  checkoutShowNote: boolean
  thankYouMessage: string
}

interface DesignPreviewProps {
  state: DesignState
  storeName: string
  currency: string
  storeLang: string
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

function getRadiusCss(radius: string) {
  return BORDER_RADIUS_OPTIONS.find((r) => r.value === radius)?.css || "8px"
}

const tabs: { value: PreviewTab; labelKey: string }[] = [
  { value: "store", labelKey: "designPreview.tabStore" },
  { value: "checkout", labelKey: "designPreview.tabCheckout" },
  { value: "thankyou", labelKey: "designPreview.tabThankYou" },
]

export function DesignPreview({ state, storeName, currency, storeLang, previewTab, onTabChange }: DesignPreviewProps) {
  const { t, i18n } = useTranslation()
  const st = i18n.getFixedT(storeLang)
  const radiusCss = getRadiusCss(state.borderRadius)
  const isRtl = RTL_LANGS.has(storeLang)

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

      <div className="rounded-[2.5rem] border-[3px] border-gray-900 bg-white p-2 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-1 h-5 w-24 rounded-full bg-gray-900" />

        {/* Screen */}
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="h-[560px] overflow-y-auto rounded-[2rem]"
          style={
            {
              "--store-primary": state.primaryColor,
              "--store-accent": state.accentColor,
              backgroundColor: state.backgroundColor,
              color: state.textColor,
              fontFamily: `'${state.fontFamily}', sans-serif`,
            } as React.CSSProperties
          }
        >
          {previewTab === "store" && (
            <StorePreview
              state={state}
              storeName={storeName}
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
  currency: string
  radiusCss: string
  st: TFunction
  cartCount: number
  cartTotal: number
  onAddToCart: (name: string, price: number) => void
  onGoToCheckout: () => void
}) {
  const [img1, img2] = pickImages(storeName)

  return (
    <>
      <PreviewHeader state={state} storeName={storeName} cartCount={cartCount} onCartClick={onGoToCheckout} />
      {state.bannerUrl && (
        <div className="px-3 pt-3">
          <img src={state.bannerUrl} alt="" className="w-full" style={{ borderRadius: radiusCss }} />
        </div>
      )}
      <div className="p-3">
        {state.showSearch && (
          <div className="relative mb-2">
            <div className="flex h-7 w-full items-center rounded-md border border-current/10 bg-current/5 ps-7 text-[9px] opacity-50" style={{ borderRadius: radiusCss }}>
              {st("search.searchProducts")}
            </div>
            <svg className="absolute start-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        )}
        <div className={cn("grid gap-2", state.theme === "single" ? "grid-cols-1" : "grid-cols-2")}>
          <PreviewProductCard state={state} name={st("designPreview.sampleProduct")} price={99} currency={currency} radiusCss={radiusCss} st={st} onAdd={onAddToCart} imageUrl={img1} />
          <PreviewProductCard state={state} name={st("designPreview.anotherItem")} price={149} currency={currency} radiusCss={radiusCss} st={st} onAdd={onAddToCart} imageUrl={img2} />
        </div>
      </div>
      <div className="border-t px-3 py-4 text-center text-[10px] opacity-50">
        <p>&copy; {new Date().getFullYear()} {storeName}</p>
      </div>

      {state.showFloatingCart && cartCount > 0 && (
        <div className="sticky bottom-2 mx-3">
          <button
            type="button"
            onClick={onGoToCheckout}
            className="animate-[subtle-bounce_5s_ease-in-out_infinite] flex w-full items-center justify-center gap-2 px-4 py-2 text-[10px] font-medium shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "var(--store-accent)",
              color: state.buttonTextColor,
              borderRadius: radiusCss,
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
      <div className="p-3 space-y-3">
        {/* Cart summary */}
        {cartItems.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-bold">{st("designPreview.viewCart")} ({itemCount})</p>
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
            <div className="border-t pt-3">
              <p className="text-xs font-bold">{st("designPreview.deliveryInformation")}</p>
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
              className="mt-1 w-full py-2 text-[10px] font-medium"
              style={{
                backgroundColor: "var(--store-accent)",
                color: state.buttonTextColor,
                borderRadius: radiusCss,
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
      <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
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
    <div
      className="sticky top-0 z-10 border-b backdrop-blur"
      style={{ backgroundColor: `${state.backgroundColor}f2` }}
    >
      <div className="flex h-10 items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          {state.logoUrl && (
            <img
              src={state.logoUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          )}
          <span
            className="text-sm font-bold"
            style={{ color: "var(--store-primary)" }}
          >
            {storeName}
          </span>
        </div>
        <button type="button" className="relative" onClick={onCartClick}>
          <ShoppingCart className="h-3.5 w-3.5 opacity-50" />
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
    </div>
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

  return (
    <div
      className={`overflow-hidden ${themeCard[state.theme]}`}
      style={{ borderRadius: radiusCss, backgroundColor: state.backgroundColor }}
    >
      <div className="aspect-square overflow-hidden bg-gray-100" style={{ borderRadius: `${radiusCss} ${radiusCss} 0 0` }}>
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover grayscale"
        />
      </div>
      <div className="p-2">
        <p className="text-[11px] font-medium leading-tight">{name}</p>
        <p
          className="mt-0.5 text-[11px] font-bold"
          style={{ color: "var(--store-primary)" }}
        >
          {price.toFixed(2)} {currency}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "mt-1.5 w-full px-2 py-1 text-[10px] font-medium transition-all",
            added && "scale-95"
          )}
          style={{
            backgroundColor: "var(--store-accent)",
            color: state.buttonTextColor,
            borderRadius: radiusCss,
          }}
        >
          {added ? "✓" : st("designPreview.addToCart")}
        </button>
      </div>
    </div>
  )
}
