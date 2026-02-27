"use client"

import { createContext, useContext } from "react"

export interface StoreConfig {
  currency: string
  buttonStyle: string
  baseHref: string
  market: { id: string; slug: string } | null
  showEmail: boolean
  showCountry: boolean
  showCity: boolean
  showNote: boolean
  thankYouMessage: string
  requireCaptcha: boolean
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
