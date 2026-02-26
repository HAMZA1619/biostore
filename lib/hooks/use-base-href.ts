"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useStoreConfig } from "@/lib/store/store-config"

export function useBaseHref(): string {
  const { slug } = useParams<{ slug: string }>()
  const config = useStoreConfig()
  const [baseHref, setBaseHref] = useState(config?.baseHref ?? `/${slug}`)

  useEffect(() => {
    if (config) return
    const el = document.querySelector("[data-base-href]")
    if (el) {
      setBaseHref(el.getAttribute("data-base-href") || `/${slug}`)
    }
  }, [slug, config])

  return config?.baseHref ?? baseHref
}
