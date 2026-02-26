"use client"

import { useEffect, useState, useCallback } from "react"
import { useStoreConfig } from "@/lib/store/store-config"

interface MarketInfo {
  id: string
  slug: string
}

function readMarket(): MarketInfo | null {
  const el = document.querySelector("[data-market-id]")
  if (el) {
    const id = el.getAttribute("data-market-id")
    if (id) {
      return { id, slug: el.getAttribute("data-market-slug") || "" }
    }
  }
  return null
}

export function useMarket(): MarketInfo | null {
  const config = useStoreConfig()
  const [market, setMarket] = useState<MarketInfo | null>(config?.market || null)

  const sync = useCallback(() => {
    const m = readMarket()
    setMarket((prev) => {
      if (prev?.id === m?.id && prev?.slug === m?.slug) return prev
      return m
    })
  }, [])

  useEffect(() => {
    if (config) return
    sync()
    const el = document.querySelector("[data-market-id]")
    if (!el) return
    const observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ["data-market-id", "data-market-slug"] })
    return () => observer.disconnect()
  }, [sync, config])

  return config?.market || market
}
