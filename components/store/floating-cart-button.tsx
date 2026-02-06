"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { formatPriceSymbol } from "@/lib/utils"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { ShoppingCart } from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

export function FloatingCartButton() {
  const { slug } = useParams<{ slug: string }>()
  const pathname = usePathname()
  const currency = useStoreCurrency()
  const items = useCartStore((s) => s.items)
  const getTotal = useCartStore((s) => s.getTotal)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isCartPage = pathname === `/${slug}/cart`
  const count = getItemCount()
  const show = mounted && count > 0 && !isCartPage

  return (
    <div
      className={`fixed bottom-3 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 transition-all duration-300 sm:bottom-6 sm:w-auto ${
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href={`/${slug}/cart`}
        className="animate-[subtle-bounce_5s_ease-in-out_infinite] flex items-center justify-center gap-3 rounded-full px-5 py-3 shadow-lg transition-transform hover:scale-105 active:scale-95 sm:gap-4 sm:px-8 sm:py-3.5"
        style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}
      >
        <div className="relative">
          <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold" style={{ color: "var(--store-accent)" }}>
            {count}
          </span>
        </div>
        <span className="font-medium sm:text-lg">View Cart</span>
        <span className="font-bold sm:text-lg">{formatPriceSymbol(getTotal(), currency)}</span>
      </Link>
    </div>
  )
}
