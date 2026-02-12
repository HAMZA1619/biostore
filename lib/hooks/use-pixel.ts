"use client"

import { useCallback } from "react"

type FbqFunction = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: FbqFunction
  }
}

export function usePixel() {
  return useCallback((eventName: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", eventName, data)
    }
  }, [])
}
