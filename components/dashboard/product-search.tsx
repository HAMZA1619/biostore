"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function ProductSearch() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleChange(value: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set("q", value.trim())
      } else {
        params.delete("q")
      }
      params.delete("page")
      router.push(`?${params.toString()}`)
    }, 300)
  }

  return (
    <div className="relative">
      <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        defaultValue={searchParams.get("q") || ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("search.searchProducts")}
        className="ps-9"
      />
    </div>
  )
}
