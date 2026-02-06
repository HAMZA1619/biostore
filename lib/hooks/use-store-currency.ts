"use client"

import { useEffect, useState } from "react"

export function useStoreCurrency() {
  const [currency, setCurrency] = useState("MAD")

  useEffect(() => {
    const el = document.querySelector("[data-currency]")
    if (el) {
      setCurrency(el.getAttribute("data-currency") || "MAD")
    }
  }, [])

  return currency
}
