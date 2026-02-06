"use client"

import { formatPriceSymbol } from "@/lib/utils"
import { useCartStore } from "@/lib/store/cart-store"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { Button } from "@/components/ui/button"
import { ImageIcon, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    compare_at_price: number | null
    image_urls: string[]
    is_available: boolean
    stock?: number | null
    options?: unknown[]
    product_variants?: { price: number }[]
  }
  storeSlug: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const currency = useStoreCurrency()
  const hasVariants = product.options && product.options.length > 0
  const inStock = product.is_available && (product.stock === null || product.stock === undefined || product.stock > 0)

  function handleAdd() {
    if (!inStock) return
    addItem(
      {
        productId: product.id,
        variantId: null,
        name: product.name,
        variantLabel: null,
        price: product.price,
        imageUrl: product.image_urls[0] || null,
      },
      storeSlug
    )
  }

  const minVariantPrice = product.product_variants?.length
    ? Math.min(...product.product_variants.map((v) => v.price))
    : null

  const displayPrice = hasVariants && minVariantPrice != null ? minVariantPrice : product.price

  return (
    <div className="store-card group overflow-hidden" style={{ borderRadius: "var(--store-radius)" }}>
      <Link href={`/${storeSlug}/products/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {product.image_urls[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/${storeSlug}/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2lh] font-medium leading-tight">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-bold" style={{ color: "var(--store-primary)" }}>
            {hasVariants && minVariantPrice != null ? "From " : ""}
            {formatPriceSymbol(displayPrice, currency)}
          </span>
          {!hasVariants && product.compare_at_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPriceSymbol(product.compare_at_price, currency)}
            </span>
          )}
        </div>
        {hasVariants ? (
          <Button
            asChild
            size="sm"
            className="mt-2 w-full"
            style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)", borderRadius: "var(--store-radius)" }}
          >
            <Link href={`/${storeSlug}/products/${product.id}`}>
              Choose options
            </Link>
          </Button>
        ) : (
          <Button
            onClick={handleAdd}
            size="sm"
            className="mt-2 w-full"
            disabled={!inStock}
            style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)", borderRadius: "var(--store-radius)" }}
          >
            <ShoppingCart className="mr-2 h-3 w-3" />
            {inStock ? "Add to cart" : "Sold out"}
          </Button>
        )}
      </div>
    </div>
  )
}
