"use client"

import { createContext, useContext } from "react"

export interface StoreConfig {
  currency: string
  buttonStyle: string
  buttonSize: string
  baseHref: string
  market: { id: string; slug: string } | null
  showEmail: boolean
  showCountry: boolean
  showCity: boolean
  showNote: boolean
  thankYouMessage: string
  requireCaptcha: boolean
  checkoutFields: Record<string, { label?: Record<string, string>; placeholder?: Record<string, string> }>
  variantStyle: string
  faqStyle: string
  showProductSku: boolean
  showStockBadge: boolean
}

const StoreConfigContext = createContext<StoreConfig | null>(null)

export function StoreConfigProvider({
  config,
  children,
}: {
  config: StoreConfig
  children: React.ReactNode
}) {
  return (
    <StoreConfigContext.Provider value={config}>
      {children}
    </StoreConfigContext.Provider>
  )
}

export function useStoreConfig(): StoreConfig | null {
  return useContext(StoreConfigContext)
}
