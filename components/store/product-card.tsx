"use client"

import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { ExternalLink, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    compare_at_price: number | null
    image_urls: string[]
    is_available: boolean
    product_type: string
    external_url: string | null
  }
  storeSlug: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAdd() {
    if (!product.is_available) return
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_urls[0] || null,
      },
      storeSlug
    )
    toast.success("Added to cart")
  }

  const isExternal = product.product_type === "external"

  return (
    <div className="group overflow-hidden rounded-lg border">
      <Link href={isExternal && product.external_url ? product.external_url : `/${storeSlug}/products/${product.id}`} target={isExternal ? "_blank" : undefined}>
        <div className="aspect-square overflow-hidden bg-muted">
          {product.image_urls[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={isExternal && product.external_url ? product.external_url : `/${storeSlug}/products/${product.id}`} target={isExternal ? "_blank" : undefined}>
          <h3 className="font-medium leading-tight">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-bold" style={{ color: "var(--store-primary)" }}>
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
        {isExternal ? (
          <Button
            asChild
            size="sm"
            className="mt-2 w-full"
            style={{ backgroundColor: "var(--store-accent)" }}
          >
            <a href={product.external_url || "#"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3 w-3" />
              Buy now
            </a>
          </Button>
        ) : (
          <Button
            onClick={handleAdd}
            size="sm"
            className="mt-2 w-full"
            disabled={!product.is_available}
            style={{ backgroundColor: "var(--store-accent)" }}
          >
            <ShoppingCart className="mr-2 h-3 w-3" />
            {product.is_available ? "Add to cart" : "Sold out"}
          </Button>
        )}
      </div>
    </div>
  )
}
