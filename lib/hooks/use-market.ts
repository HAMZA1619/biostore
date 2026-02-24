"use client"

import { useEffect, useState } from "react"

interface MarketInfo {
  id: string
  slug: string
}

export function useMarket(): MarketInfo | null {
  const [market, setMarket] = useState<MarketInfo | null>(null)

  useEffect(() => {
    const el = document.querySelector("[data-market-id]")
    if (el) {
      const id = el.getAttribute("data-market-id")
      if (id) {
        setMarket({
          id,
          slug: el.getAttribute("data-market-slug") || "",
        })
      }
    }
  }, [])

  return market
}
