"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { usePixel } from "@/lib/hooks/use-pixel"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    imageUrl: string | null
    isAvailable: boolean
  }
  storeSlug: string
}

export function AddToCartButton({ product, storeSlug }: AddToCartButtonProps) {
  const { t } = useTranslation()
  const addItem = useCartStore((s) => s.addItem)
  const track = usePixel()
  const currency = useStoreCurrency()

  function handleAdd() {
    if (!product.isAvailable) return
    addItem(
      {
        productId: product.id,
        variantId: null,
        name: product.name,
        variantLabel: null,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      storeSlug
    )
    track("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: currency.toUpperCase(),
    })
  }

  return (
    <Button
      onClick={handleAdd}
      size="lg"
      className="w-full"
      disabled={!product.isAvailable}
      style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}
    >
      <ShoppingCart className="me-2 h-4 w-4" />
      {product.isAvailable ? t("storefront.addToCart") : t("storefront.soldOut")}
    </Button>
  )
}
