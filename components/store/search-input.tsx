"use client"

import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useTransition } from "react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface SearchInputProps {
  storeSlug: string
}

export function SearchInput({ storeSlug }: SearchInputProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (value.trim()) {
          params.set("search", value.trim())
        } else {
          params.delete("search")
        }
        params.delete("collection")
        const qs = params.toString()
        router.replace(`/${storeSlug}${qs ? `?${qs}` : ""}`)
      })
    }, 300)
  }

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        defaultValue={searchParams.get("search") || ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("search.searchProducts")}
        className="h-10 w-full rounded-lg border bg-background ps-9 pe-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
        style={{ borderRadius: "var(--store-radius)" }}
      />
      {isPending && (
        <div className="absolute end-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
    </div>
  )
}
