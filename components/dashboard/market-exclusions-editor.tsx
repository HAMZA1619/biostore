"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import "@/lib/i18n"

interface Product {
  id: string
  name: string
  image_url: string | null
}

interface MarketExclusionsEditorProps {
  marketId: string
  marketName: string
  products: Product[]
  initialExclusions: string[]
}

export function MarketExclusionsEditor({
  marketId,
  marketName,
  products,
  initialExclusions,
}: MarketExclusionsEditorProps) {
  const { t } = useTranslation()
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set(initialExclusions))
  const savedRef = useRef<Set<string>>(new Set(initialExclusions))
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const hasChanges = useMemo(() => {
    if (excluded.size !== savedRef.current.size) return true
    for (const id of excluded) {
      if (!savedRef.current.has(id)) return true
    }
    return false
  }, [excluded])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  const hiddenCount = excluded.size

  function toggleProduct(productId: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/markets/exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_id: marketId, excluded_product_ids: Array.from(excluded) }),
      })

      if (!res.ok) {
        toast.error(t("markets.exclusions.saveFailed"))
        return
      }

      savedRef.current = new Set(excluded)
      toast.success(t("markets.exclusions.saved"))
    } catch {
      toast.error(t("markets.exclusions.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">{marketName}</h1>
          {hiddenCount > 0 && (
            <Badge variant="secondary">
              {t("markets.exclusions.hiddenCount", { count: hiddenCount })}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/markets">
              {t("markets.cancel")}
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {saving ? t("markets.exclusions.saving") : t("markets.exclusions.save")}
          </Button>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground">{t("markets.exclusions.subtitle")}</p>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("markets.exclusions.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 ps-9"
        />
      </div>

      {/* Product list */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {products.length === 0 ? t("markets.exclusions.noProducts") : t("markets.exclusions.noResults")}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredProducts.map((product) => {
            const isVisible = !excluded.has(product.id)
            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-opacity ${!isVisible ? "opacity-50" : ""}`}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  {!isVisible && (
                    <p className="text-xs text-muted-foreground">{t("markets.exclusions.hidden")}</p>
                  )}
                </div>
                <Switch
                  checked={isVisible}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
