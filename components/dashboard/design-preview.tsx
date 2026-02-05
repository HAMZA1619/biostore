"use client"

import { ShoppingCart } from "lucide-react"

export interface DesignState {
  logoUrl: string | null
  bannerUrl: string | null
  primaryColor: string
  accentColor: string
  theme: "default" | "modern" | "minimal"
  showBranding: boolean
}

interface DesignPreviewProps {
  state: DesignState
  storeName: string
  phone: string | null
}

const themeCard: Record<string, string> = {
  default: "rounded-lg border",
  modern: "rounded-2xl shadow-md",
  minimal: "rounded-none border-b",
}

const themeImage: Record<string, string> = {
  default: "rounded-t-lg",
  modern: "rounded-t-2xl",
  minimal: "rounded-none",
}

export function DesignPreview({ state, storeName, phone }: DesignPreviewProps) {
  return (
    <div className="mx-auto w-[320px]">
      <p className="mb-3 text-center text-sm text-muted-foreground">Live preview</p>
      <div className="rounded-[2.5rem] border-[3px] border-gray-900 bg-white p-2 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-1 h-5 w-24 rounded-full bg-gray-900" />

        {/* Screen */}
        <div
          className="h-[560px] overflow-y-auto rounded-[2rem] bg-white"
          style={
            {
              "--store-primary": state.primaryColor,
              "--store-accent": state.accentColor,
            } as React.CSSProperties
          }
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
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
              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Banner */}
          {state.bannerUrl && (
            <img
              src={state.bannerUrl}
              alt=""
              className="h-24 w-full object-cover"
            />
          )}

          {/* Products */}
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <PreviewProductCard state={state} name="Sample Product" price="99.00" />
              <PreviewProductCard state={state} name="Another Item" price="149.00" />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-4 text-center text-[10px] text-gray-400">
            {phone && <p className="mb-1">Contact us on WhatsApp</p>}
            {state.showBranding && <p>Powered by BioStore</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewProductCard({
  state,
  name,
  price,
}: {
  state: DesignState
  name: string
  price: string
}) {
  return (
    <div className={`overflow-hidden bg-white ${themeCard[state.theme]}`}>
      <div className={`aspect-square bg-gray-100 ${themeImage[state.theme]}`}>
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
          {price} MAD
        </p>
        <button
          type="button"
          className="mt-1.5 w-full rounded px-2 py-1 text-[10px] font-medium text-white"
          style={{ backgroundColor: "var(--store-accent)" }}
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}
