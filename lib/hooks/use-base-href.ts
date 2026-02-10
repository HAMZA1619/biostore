"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export function useBaseHref(): string {
  const { slug } = useParams<{ slug: string }>()
  const [baseHref, setBaseHref] = useState(`/${slug}`)

  useEffect(() => {
    const el = document.querySelector("[data-base-href]")
    if (el) {
      setBaseHref(el.getAttribute("data-base-href") || `/${slug}`)
    }
  }, [slug])

  return baseHref
}
