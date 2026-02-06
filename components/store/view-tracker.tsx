"use client"

import { useEffect } from "react"

export function ViewTracker({ storeId }: { storeId: string }) {
  useEffect(() => {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    }).catch(() => {})
  }, [storeId])

  return null
}
