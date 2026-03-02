"use client"

import { useEffect } from "react"
import { useCartStore } from "@/lib/store/cart-store"
import { useMarket } from "@/lib/hooks/use-market"
import { useParams } from "next/navigation"

export function CartRepricer() {
  const { slug } = useParams<{ slug: string }>()
  const market = useMarket()
  const items = useCartStore((s) => s.items)
  const repriceItems = useCartStore((s) => s.repriceItems)
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    const flag = sessionStorage.getItem("biostore-reprice")
    if (flag !== "1") return
    sessionStorage.removeItem("biostore-reprice")

    if (items.length === 0) return

    if (!market?.id) {
      clearCart()
      return
    }

    const repricePayload = items.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId,
    }))

    fetch("/api/products/reprice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, items: repricePayload, market_id: market.id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) {
          repriceItems(
            data.items.map((i: { product_id: string; variant_id: string | null; price: number }) => ({
              productId: i.product_id,
              variantId: i.variant_id,
              price: i.price,
            })),
            market.slug
          )
        } else {
          clearCart()
        }
      })
      .catch(() => {
        clearCart()
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
