"use client"

import { useEffect } from "react"

export function ViewTracker({ storeId, marketId }: { storeId: string; marketId?: string }) {
  useEffect(() => {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, marketId }),
    }).catch(() => {})
  }, [storeId, marketId])

  return null
}
