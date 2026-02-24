"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronRight, Copy, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getCurrencySymbol } from "@/lib/utils"
import "@/lib/i18n"

interface ProductWithVariants {
  id: string
  name: string
  price: number
  compare_at_price: number | null
  image_url: string | null
  variants: VariantRow[]
}

interface VariantRow {
  id: string
  options: Record<string, string>
  price: number
  compare_at_price: number | null
}

interface PriceEntry {
  price: number
  compare_at_price: number | null
}

interface MarketPricingEditorProps {
  marketId: string
  marketName: string
  marketCurrency: string
  storeCurrency: string
  products: ProductWithVariants[]
  initialPrices: Record<string, PriceEntry>
}

export function MarketPricingEditor({
  marketId,
  marketName,
  marketCurrency,
  storeCurrency,
  products,
  initialPrices,
}: MarketPricingEditorProps) {
  const { t } = useTranslation()
  const [prices, setPrices] = useState<Record<string, PriceEntry>>(initialPrices)
  const savedRef = useRef<Record<string, PriceEntry>>(initialPrices)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const mSymbol = getCurrencySymbol(marketCurrency)
  const sSymbol = getCurrencySymbol(storeCurrency)

  const hasChanges = useMemo(() => {
    return JSON.stringify(prices) !== JSON.stringify(savedRef.current)
  }, [prices])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  function toggleExpand(productId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  function updatePrice(key: string, field: "price" | "compare_at_price", value: string) {
    setPrices((prev) => {
      const entry = prev[key] || { price: 0, compare_at_price: null }
      if (field === "price") {
        const num = value === "" ? 0 : parseFloat(value) || 0
        return { ...prev, [key]: { ...entry, price: num } }
      } else {
        const num = value === "" ? null : parseFloat(value) || null
        return { ...prev, [key]: { ...entry, compare_at_price: num } }
      }
    })
  }

  function copyAllFromBase() {
    setPrices((prev) => {
      const updated = { ...prev }
      for (const p of products) {
        if (!updated[p.id]?.price) {
          updated[p.id] = { price: p.price, compare_at_price: p.compare_at_price }
        }
        for (const v of p.variants) {
          const vKey = `${p.id}:${v.id}`
          if (!updated[vKey]?.price) {
            updated[vKey] = { price: v.price, compare_at_price: v.compare_at_price }
          }
        }
      }
      return updated
    })
  }

  function copyBaseForProduct(product: ProductWithVariants) {
    setPrices((prev) => {
      const updated = { ...prev }
      updated[product.id] = { price: product.price, compare_at_price: product.compare_at_price }
      for (const v of product.variants) {
        updated[`${product.id}:${v.id}`] = { price: v.price, compare_at_price: v.compare_at_price }
      }
      return updated
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const rows: Array<{ product_id: string; variant_id: string | null; price: number; compare_at_price: number | null }> = []

      for (const [key, entry] of Object.entries(prices)) {
        if (!entry.price || entry.price <= 0) continue
        if (key.includes(":")) {
          const [productId, variantId] = key.split(":")
          rows.push({ product_id: productId, variant_id: variantId, price: entry.price, compare_at_price: entry.compare_at_price })
        } else {
          rows.push({ product_id: key, variant_id: null, price: entry.price, compare_at_price: entry.compare_at_price })
        }
      }

      const res = await fetch("/api/markets/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_id: marketId, prices: rows }),
      })

      if (!res.ok) {
        toast.error(t("markets.pricing.saveFailed"))
        return
      }

      savedRef.current = { ...prices }
      toast.success(t("markets.pricing.saved"))
    } catch {
      toast.error(t("markets.pricing.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  function variantLabel(options: Record<string, string>): string {
    return Object.values(options).join(" / ")
  }

  return (
    <div className="space-y-5 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">{marketName}</h1>
          <Badge variant="secondary">{marketCurrency}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/markets">
              {t("markets.cancel")}
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {saving ? t("markets.pricing.saving") : t("markets.pricing.save")}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("markets.pricing.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 ps-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={copyAllFromBase}>
          <Copy className="me-2 h-3.5 w-3.5" />
          {t("markets.pricing.copyAllFromBase")}
        </Button>
      </div>

      {/* Product list */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {products.length === 0 ? t("markets.pricing.noProducts") : t("markets.pricing.noResults")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Desktop header */}
          <div className="hidden text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_100px_140px_140px_36px] sm:gap-2 sm:px-3 sm:py-1.5">
            <span>{t("markets.pricing.product")}</span>
            <span>{t("markets.pricing.basePrice")}</span>
            <span>{t("markets.pricing.marketPrice")}</span>
            <span>{t("markets.pricing.compareAt")}</span>
            <span />
          </div>

          {filteredProducts.map((product) => {
            const isExpanded = expanded.has(product.id)
            const hasVariants = product.variants.length > 0
            const mp = prices[product.id]

            return (
              <div key={product.id} className="rounded-lg border">
                {/* Product row */}
                <div className="flex flex-col gap-2 p-3 sm:grid sm:grid-cols-[1fr_100px_140px_140px_36px] sm:items-center sm:gap-2">
                  {/* Product info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      {hasVariants && (
                        <p className="text-[11px] text-muted-foreground">
                          {product.variants.length} {product.variants.length === 1 ? t("markets.pricing.variant") : t("markets.pricing.variants")}
                        </p>
                      )}
                    </div>
                    {/* Mobile copy button */}
                    <button
                      type="button"
                      onClick={() => copyBaseForProduct(product)}
                      className="shrink-0 text-xs text-primary hover:underline sm:hidden"
                    >
                      {t("markets.pricing.copyBase")}
                    </button>
                  </div>

                  {/* Base price */}
                  <div className="flex items-center gap-2 sm:block">
                    <span className="text-xs text-muted-foreground sm:hidden">{t("markets.pricing.basePrice")}:</span>
                    <span className="text-sm tabular-nums">{sSymbol} {product.price.toFixed(2)}</span>
                  </div>

                  {/* Market price input */}
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={mp?.price || ""}
                      onChange={(e) => updatePrice(product.id, "price", e.target.value)}
                      placeholder="0.00"
                      className="h-8 pe-10"
                    />
                    <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{mSymbol}</span>
                  </div>

                  {/* Compare at price input */}
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={mp?.compare_at_price ?? ""}
                      onChange={(e) => updatePrice(product.id, "compare_at_price", e.target.value)}
                      placeholder="—"
                      className="h-8 pe-10"
                    />
                    <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{mSymbol}</span>
                  </div>

                  {/* Expand toggle */}
                  <div className="hidden sm:flex sm:justify-center">
                    {hasVariants ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(product.id)}
                        className="rounded p-1 hover:bg-muted"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => copyBaseForProduct(product)}
                        className="rounded p-1 text-muted-foreground hover:text-primary"
                        title={t("markets.pricing.copyBase")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Mobile expand button */}
                  {hasVariants && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(product.id)}
                      className="flex items-center gap-1 text-xs text-primary sm:hidden"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {isExpanded ? t("markets.pricing.hideVariants") : t("markets.pricing.showVariants")}
                    </button>
                  )}
                </div>

                {/* Expanded variant rows */}
                {isExpanded && hasVariants && (
                  <div className="border-t bg-muted/30">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-medium text-muted-foreground">{t("markets.pricing.variantPrices")}</span>
                      <button
                        type="button"
                        onClick={() => copyBaseForProduct(product)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("markets.pricing.copyBase")}
                      </button>
                    </div>
                    {product.variants.map((variant) => {
                      const vKey = `${product.id}:${variant.id}`
                      const vmp = prices[vKey]
                      return (
                        <div
                          key={variant.id}
                          className="flex flex-col gap-2 border-t px-3 py-2 sm:grid sm:grid-cols-[1fr_100px_140px_140px_36px] sm:items-center sm:gap-2"
                        >
                          <span className="truncate text-xs ps-10.5">{variantLabel(variant.options)}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            <span className="sm:hidden">{t("markets.pricing.basePrice")}: </span>
                            {sSymbol} {variant.price.toFixed(2)}
                          </span>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={vmp?.price || ""}
                              onChange={(e) => updatePrice(vKey, "price", e.target.value)}
                              placeholder="0.00"
                              className="h-7 pe-10 text-xs"
                            />
                            <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{mSymbol}</span>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={vmp?.compare_at_price ?? ""}
                              onChange={(e) => updatePrice(vKey, "compare_at_price", e.target.value)}
                              placeholder="—"
                              className="h-7 pe-10 text-xs"
                            />
                            <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{mSymbol}</span>
                          </div>
                          <span />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
