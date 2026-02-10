"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ProductCard } from "./product-card"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface Product {
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

interface ProductGridProps {
  initialProducts: Product[]
  storeId: string
  storeSlug: string
  collectionId?: string | null
  search?: string | null
  hasMore: boolean
}

export function ProductGrid({ initialProducts, storeId, storeSlug, collectionId, search, hasMore: initialHasMore }: ProductGridProps) {
  const { t } = useTranslation()
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset when collection changes
  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
    setHasMore(initialHasMore)
  }, [initialProducts, initialHasMore])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = new URLSearchParams({ store_id: storeId, page: String(page) })
      if (collectionId) params.set("collection_id", collectionId)
      if (search) params.set("search", search)

      const res = await fetch(`/api/products?${params}`)

      if (!res.ok) {
        setHasMore(false)
        return
      }

      const data = await res.json()

      setProducts((prev) => [...prev, ...data.products])
      setHasMore(data.hasMore)
      setPage((prev) => prev + 1)
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, storeId, collectionId, search, page])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("storefront.noProducts")}
      </div>
    )
  }

  return (
    <>
      <div className="product-grid grid grid-cols-2 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </>
  )
}
