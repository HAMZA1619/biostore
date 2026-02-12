"use client"

import type React from "react"
import { useState, useEffect } from "react"

export function useButtonStyle(): string {
  const [style, setStyle] = useState("filled")

  useEffect(() => {
    const value = document.querySelector("[data-button-style]")?.getAttribute("data-button-style") || "filled"
    setStyle(value)
  }, [])

  return style
}

export function getButtonStyleProps(buttonStyle: string): React.CSSProperties {
  return {
    backgroundColor: buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
    color: buttonStyle === "outline" ? "var(--store-accent)" : "var(--store-btn-text)",
    borderRadius: buttonStyle === "pill" ? "9999px" : "var(--store-radius)",
    border: buttonStyle === "outline" ? "2px solid var(--store-accent)" : "none",
  }
}
