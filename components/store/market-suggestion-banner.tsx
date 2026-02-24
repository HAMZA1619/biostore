"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useCartStore } from "@/lib/store/cart-store"

interface MarketSuggestionBannerProps {
  suggestedMarket: { slug: string; name: string; currency: string }
  currentMarketSlug?: string | null
}

export function MarketSuggestionBanner({ suggestedMarket, currentMarketSlug }: MarketSuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()
  const { t } = useTranslation()

  if (dismissed) return null

  function setMarketCookie(slug: string) {
    document.cookie = `biostore-market=${slug};path=/;max-age=31536000;SameSite=Lax`
  }

  const clearCart = useCartStore((s) => s.clearCart)

  function handleSwitch() {
    clearCart()
    setMarketCookie(suggestedMarket.slug)
    router.refresh()
    setDismissed(true)
  }

  function handleDismiss() {
    if (currentMarketSlug) {
      setMarketCookie(currentMarketSlug)
    }
    setDismissed(true)
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm" style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}>
      <span className="text-center">
        {t("storefront.marketSuggestion", { country: suggestedMarket.name, currency: suggestedMarket.currency })}
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="h-6 px-2 text-xs"
        onClick={handleSwitch}
      >
        {t("storefront.switchMarket")}
      </Button>
      <button onClick={handleDismiss} className="ml-1 opacity-70 hover:opacity-100" aria-label={t("storefront.dismiss")}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
