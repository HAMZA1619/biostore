"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface CollectionTabsProps {
  storeSlug: string
  collections: { id: string; name: string; slug: string }[]
}

export function CollectionTabs({ storeSlug, collections }: CollectionTabsProps) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const activeCollection = searchParams.get("collection")

  if (collections.length === 0) return null

  const activeStyle = { backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Link
        href={`/${storeSlug}`}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
          !activeCollection
            ? "border-transparent"
            : "hover:bg-muted"
        )}
        style={!activeCollection ? activeStyle : undefined}
      >
        {t("storefront.all")}
      </Link>
      {collections.map((c) => (
        <Link
          key={c.id}
          href={`/${storeSlug}?collection=${c.slug}`}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
            activeCollection === c.slug
              ? "border-transparent"
              : "hover:bg-muted"
          )}
          style={activeCollection === c.slug ? activeStyle : undefined}
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}
