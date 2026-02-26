"use client"

import { useStoreConfig } from "@/lib/store/store-config"
import { useEffect, useState, useCallback } from "react"

function readCurrency(): string {
  const el = document.querySelector("[data-currency]")
  return el?.getAttribute("data-currency") || "USD"
}

export function useStoreCurrency() {
  const config = useStoreConfig()
  const [currency, setCurrency] = useState(config?.currency || "USD")

  const sync = useCallback(() => {
    setCurrency(readCurrency())
  }, [])

  useEffect(() => {
    if (config) return
    sync()
    const el = document.querySelector("[data-currency]")
    if (!el) return
    const observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ["data-currency"] })
    return () => observer.disconnect()
  }, [sync, config])

  return config?.currency || currency
}
