"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useStoreConfig } from "@/lib/store/store-config"

export function useButtonStyle(): string {
  const config = useStoreConfig()
  const [style, setStyle] = useState(config?.buttonStyle || "filled")

  useEffect(() => {
    if (config) return
    const value = document.querySelector("[data-button-style]")?.getAttribute("data-button-style") || "filled"
    setStyle(value)
  }, [config])

  return config?.buttonStyle || style
}

export function getButtonStyleProps(buttonStyle: string): React.CSSProperties {
  return {
    backgroundColor: buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
    color: buttonStyle === "outline" ? "var(--store-accent)" : "var(--store-btn-text)",
    borderRadius: buttonStyle === "pill" ? "9999px" : "var(--store-radius)",
    border: buttonStyle === "outline" ? "2px solid var(--store-accent)" : "none",
  }
}
