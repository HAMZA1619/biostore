"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

interface CollectionTabsProps {
  storeSlug: string
  collections: { id: string; name: string; slug: string }[]
}

export function CollectionTabs({ storeSlug, collections }: CollectionTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCollection = searchParams.get("collection")

  if (collections.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Link
        href={`/${storeSlug}`}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
          !activeCollection
            ? "border-transparent bg-foreground text-background"
            : "hover:bg-muted"
        )}
      >
        All
      </Link>
      {collections.map((c) => (
        <Link
          key={c.id}
          href={`/${storeSlug}?collection=${c.slug}`}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
            activeCollection === c.slug
              ? "border-transparent bg-foreground text-background"
              : "hover:bg-muted"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}
