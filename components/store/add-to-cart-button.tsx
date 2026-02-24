"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { usePixel } from "@/lib/hooks/use-pixel"
import { useTiktokPixel } from "@/lib/hooks/use-tiktok-pixel"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { useMarket } from "@/lib/hooks/use-market"
import { useButtonStyle, getButtonStyleProps } from "@/lib/hooks/use-button-style"
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
  const ttTrack = useTiktokPixel()
  const currency = useStoreCurrency()
  const market = useMarket()
  const buttonStyle = useButtonStyle()

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
      storeSlug,
      market?.slug
    )
    track("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: currency.toUpperCase(),
    })
    ttTrack("AddToCart", {
      content_name: product.name,
      content_id: product.id,
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
      style={getButtonStyleProps(buttonStyle)}
    >
      <ShoppingCart className="me-2 h-4 w-4" />
      {product.isAvailable ? t("storefront.addToCart") : t("storefront.soldOut")}
    </Button>
  )
}
