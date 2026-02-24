"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getCurrencySymbol } from "@/lib/utils"
import { useCartStore } from "@/lib/store/cart-store"

interface Market {
  slug: string
  name: string
  currency: string
}

interface MarketPickerProps {
  markets: Market[]
  activeMarketSlug?: string | null
}

export function MarketPicker({ markets, activeMarketSlug }: MarketPickerProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const activeMarket = markets.find((m) => m.slug === activeMarketSlug) || markets[0]

  const clearCart = useCartStore((s) => s.clearCart)

  function handleSelect(slug: string) {
    if (slug !== activeMarketSlug) {
      clearCart()
    }
    document.cookie = `biostore-market=${slug};path=/;max-age=31536000;SameSite=Lax`
    setOpen(false)
    router.refresh()
  }

  if (markets.length <= 1) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
          <Globe className="h-3.5 w-3.5" />
          <span>{activeMarket?.currency || "---"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {markets.map((m) => (
          <button
            key={m.slug}
            onClick={() => handleSelect(m.slug)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
              m.slug === activeMarket?.slug ? "font-medium text-primary" : ""
            }`}
          >
            <span>{m.name}</span>
            <span className="text-muted-foreground text-xs">{getCurrencySymbol(m.currency)}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
