"use client"

import { useCallback } from "react"

interface TtqFunction {
  track: (eventName: string, data?: Record<string, unknown>) => void
}

declare global {
  interface Window {
    ttq?: TtqFunction
  }
}

export function useTiktokPixel() {
  return useCallback((eventName: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track(eventName, data)
    }
  }, [])
}
