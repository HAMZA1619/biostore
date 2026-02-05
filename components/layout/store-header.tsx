"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface StoreHeaderProps {
  slug: string
  name: string
  logoUrl?: string | null
  bannerUrl?: string | null
}

export function StoreHeader({ slug, name, logoUrl, bannerUrl }: StoreHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((s) => s.getItemCount())

  useEffect(() => setMounted(true), [])

  return (
    <>
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href={`/${slug}`} className="flex items-center gap-2">
          {logoUrl && (
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          )}
          <span className="text-lg font-bold" style={{ color: "var(--store-primary)" }}>
            {name}
          </span>
        </Link>
        <Button asChild variant="outline" size="sm" className="relative">
          <Link href={`/${slug}/cart`}>
            <ShoppingCart className="h-4 w-4" />
            {mounted && itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </Button>
      </div>
    </header>
    {bannerUrl && (
      <div className="mx-auto max-w-2xl">
        <img src={bannerUrl} alt="" className="h-32 w-full object-cover" />
      </div>
    )}
  </>
  )
}
