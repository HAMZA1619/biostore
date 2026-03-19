"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { useBaseHref } from "@/lib/hooks/use-base-href"
import { useEffect, useState } from "react"
import { cn, getImageUrl } from "@/lib/utils"
import { MarketPicker } from "@/components/store/market-picker"
import { LanguagePicker } from "@/components/store/language-picker"
import Image from "next/image"

interface StoreHeaderProps {
  slug: string
  name: string
  logoPath?: string | null
  bannerPath?: string | null
  stickyHeader?: boolean
  stickyAnnouncement?: boolean
  markets?: { slug: string; name: string; currency: string }[]
  activeMarketSlug?: string | null
  enabledLanguages?: { code: string; name: string }[]
  activeLanguage?: string
}

export function StoreHeader({ slug, name, logoPath, bannerPath, stickyHeader = true, stickyAnnouncement, markets, activeMarketSlug, enabledLanguages, activeLanguage }: StoreHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const baseHref = useBaseHref()
  const itemCount = useCartStore((s) => s.getItemCount())
  const isHomePage = pathname === `/${slug}` || pathname === "/"
  const logoUrl = getImageUrl(logoPath)
  const bannerUrl = getImageUrl(bannerPath)

  useEffect(() => setMounted(true), [])

  return (
    <>
    <header className={cn("z-40 border-b backdrop-blur", stickyHeader && "sticky top-0")} style={{ top: stickyAnnouncement ? "var(--announcement-h, 0px)" : undefined, backgroundColor: "color-mix(in srgb, var(--store-bg) 95%, transparent)" }}>
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href={baseHref || "/"} className="flex items-center gap-2">
          {logoUrl && (
            <Image src={logoUrl} alt={`${name} logo`} width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" />
          )}
          <span className="truncate text-lg font-bold" style={{ color: "var(--store-primary)", fontFamily: "var(--store-heading-font)" }}>
            {name}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {enabledLanguages && enabledLanguages.length > 1 && (
            <LanguagePicker languages={enabledLanguages} activeLanguage={activeLanguage || ""} />
          )}
          {markets && markets.length > 1 && (
            <MarketPicker markets={markets} activeMarketSlug={activeMarketSlug} />
          )}
          <Button asChild variant="outline" size="sm" className="relative">
            <Link href={`${baseHref}/cart`}>
              <ShoppingCart className="h-4 w-4" />
              {mounted && itemCount > 0 && (
                <span className="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
    {bannerUrl && isHomePage && (
      <div className="relative mx-auto max-w-2xl px-4 pt-4">
        <Image src={bannerUrl} alt={`${name} banner`} width={672} height={224} sizes="(max-width: 672px) 100vw, 672px" className="w-full h-auto" style={{ borderRadius: "var(--store-radius)" }} />
      </div>
    )}
  </>
  )
}
