"use client"

import { CheckCircle, ShoppingCart } from "lucide-react"
import { BORDER_RADIUS_OPTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"

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
  theme: "default" | "modern" | "minimal"
  showBranding: boolean
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
  previewTab: PreviewTab
  onTabChange: (tab: PreviewTab) => void
}

const themeCard: Record<string, string> = {
  default: "border",
  modern: "shadow-md",
  minimal: "border-b",
}

const DEFAULT_THANK_YOU = "Thank you for your order! We've received it and will confirm it shortly."

function getRadiusCss(radius: string) {
  return BORDER_RADIUS_OPTIONS.find((r) => r.value === radius)?.css || "8px"
}

const tabs: { value: PreviewTab; label: string }[] = [
  { value: "store", label: "Store" },
  { value: "checkout", label: "Checkout" },
  { value: "thankyou", label: "Thank You" },
]

export function DesignPreview({ state, storeName, currency, previewTab, onTabChange }: DesignPreviewProps) {
  const radiusCss = getRadiusCss(state.borderRadius)

  return (
    <div className="mx-auto w-[320px]">
      {/* Tab switcher */}
      <div className="mb-3 flex items-center justify-center gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onTabChange(t.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              previewTab === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-[2.5rem] border-[3px] border-gray-900 bg-white p-2 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-1 h-5 w-24 rounded-full bg-gray-900" />

        {/* Screen */}
        <div
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
            <StorePreview state={state} storeName={storeName} currency={currency} radiusCss={radiusCss} />
          )}
          {previewTab === "checkout" && (
            <CheckoutPreview state={state} storeName={storeName} radiusCss={radiusCss} />
          )}
          {previewTab === "thankyou" && (
            <ThankYouPreview state={state} storeName={storeName} radiusCss={radiusCss} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Store tab (existing) ── */
function StorePreview({
  state,
  storeName,
  currency,
  radiusCss,
}: {
  state: DesignState
  storeName: string
  currency: string
  radiusCss: string
}) {
  return (
    <>
      <PreviewHeader state={state} storeName={storeName} />
      {state.bannerUrl && (
        <img src={state.bannerUrl} alt="" className="h-24 w-full object-cover" />
      )}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <PreviewProductCard state={state} name="Sample Product" price="99.00" currency={currency} radiusCss={radiusCss} />
          <PreviewProductCard state={state} name="Another Item" price="149.00" currency={currency} radiusCss={radiusCss} />
        </div>
      </div>
      <div className="border-t px-3 py-4 text-center text-[10px] opacity-50">
        {state.showBranding && <p>Powered by BioStore</p>}
      </div>
    </>
  )
}

/* ── Checkout tab ── */
function CheckoutPreview({
  state,
  storeName,
  radiusCss,
}: {
  state: DesignState
  storeName: string
  radiusCss: string
}) {
  return (
    <>
      <PreviewHeader state={state} storeName={storeName} />
      <div className="p-3 space-y-3">
        <p className="text-xs font-bold">Delivery Information</p>

        <PreviewField label="Full name" />
        <PreviewField label="Phone" />

        {state.checkoutShowEmail && <PreviewField label="Email" />}
        {state.checkoutShowCountry && <PreviewField label="Country" />}
        {state.checkoutShowCity && <PreviewField label="City" />}

        <PreviewField label="Address" tall />

        {state.checkoutShowNote && <PreviewField label="Note" tall />}

        {/* Submit button */}
        <button
          type="button"
          className="mt-1 w-full py-2 text-[10px] font-medium"
          style={{
            backgroundColor: "var(--store-accent)",
            color: state.buttonTextColor,
            borderRadius: radiusCss,
          }}
        >
          Order now
        </button>
      </div>
    </>
  )
}

/* ── Thank you tab ── */
function ThankYouPreview({
  state,
  storeName,
  radiusCss,
}: {
  state: DesignState
  storeName: string
  radiusCss: string
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
        <p className="text-sm font-bold">Order Confirmed!</p>
        <p className="text-[10px] opacity-60">Order #1234</p>
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
          Continue shopping
        </button>
      </div>
    </>
  )
}

/* ── Shared components ── */
function PreviewHeader({
  state,
  storeName,
}: {
  state: DesignState
  storeName: string
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
        <ShoppingCart className="h-3.5 w-3.5 opacity-50" />
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
}: {
  state: DesignState
  name: string
  price: string
  currency: string
  radiusCss: string
}) {
  return (
    <div
      className={`overflow-hidden ${themeCard[state.theme]}`}
      style={{ borderRadius: radiusCss, backgroundColor: state.backgroundColor }}
    >
      <div className="aspect-square bg-gray-100" style={{ borderRadius: `${radiusCss} ${radiusCss} 0 0` }}>
        <div className="flex h-full items-center justify-center text-[10px] text-gray-300">
          Image
        </div>
      </div>
      <div className="p-2">
        <p className="text-[11px] font-medium leading-tight">{name}</p>
        <p
          className="mt-0.5 text-[11px] font-bold"
          style={{ color: "var(--store-primary)" }}
        >
          {price} {currency}
        </p>
        <button
          type="button"
          className="mt-1.5 w-full px-2 py-1 text-[10px] font-medium"
          style={{
            backgroundColor: "var(--store-accent)",
            color: state.buttonTextColor,
            borderRadius: radiusCss,
          }}
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}
