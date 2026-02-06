"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

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
  const addItem = useCartStore((s) => s.addItem)

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
  }

  return (
    <Button
      onClick={handleAdd}
      size="lg"
      className="w-full"
      disabled={!product.isAvailable}
      style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {product.isAvailable ? "Add to cart" : "Sold out"}
    </Button>
  )
}
