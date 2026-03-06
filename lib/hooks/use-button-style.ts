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

export function useButtonSize(): "sm" | "default" | "lg" {
  const config = useStoreConfig()
  const [size, setSize] = useState<"sm" | "default" | "lg">((config?.buttonSize as "sm" | "default" | "lg") || "default")

  useEffect(() => {
    if (config) return
    const value = document.querySelector("[data-button-size]")?.getAttribute("data-button-size") || "default"
    setSize(value as "sm" | "default" | "lg")
  }, [config])

  return (config?.buttonSize as "sm" | "default" | "lg") || size
}

export function getButtonStyleProps(buttonStyle: string): React.CSSProperties {
  return {
    backgroundImage: "none",
    boxShadow: "none",
    backgroundColor: buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
    color: buttonStyle === "outline" ? "var(--store-accent)" : "var(--store-btn-text)",
    borderRadius: buttonStyle === "pill" ? "9999px" : "var(--store-radius)",
    border: buttonStyle === "outline" ? "2px solid var(--store-accent)" : "none",
  }
}
