"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { usePixel } from "@/lib/hooks/use-pixel"
import { useTiktokPixel } from "@/lib/hooks/use-tiktok-pixel"
import { Button } from "@/components/ui/button"
import { formatPriceSymbol } from "@/lib/utils"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { useButtonStyle, getButtonStyleProps } from "@/lib/hooks/use-button-style"
import { ShoppingCart } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface VariantOption {
  name: string
  values: string[]
}

interface Variant {
  id: string
  options: Record<string, string>
  price: number
  compare_at_price: number | null
  sku: string | null
  stock: number | null
  is_available: boolean
}

interface VariantSelectorProps {
  product: {
    id: string
    name: string
    price: number
    imageUrl: string | null
  }
  options: VariantOption[]
  variants: Variant[]
  storeSlug: string
}

export function VariantSelector({ product, options, variants, storeSlug }: VariantSelectorProps) {
  const { t } = useTranslation()
  const addItem = useCartStore((s) => s.addItem)
  const track = usePixel()
  const ttTrack = useTiktokPixel()
  const currency = useStoreCurrency()
  const buttonStyle = useButtonStyle()
  const [selected, setSelected] = useState<Record<string, string>>({})

  const allSelected = options.every((o) => selected[o.name])

  const matchedVariant = allSelected
    ? variants.find((v) =>
        options.every((o) => v.options[o.name] === selected[o.name])
      )
    : null

  const displayPrice = matchedVariant ? matchedVariant.price : product.price
  const displayCompareAtPrice = matchedVariant?.compare_at_price ?? null
  const variantInStock = matchedVariant
    ? matchedVariant.is_available && (matchedVariant.stock === null || matchedVariant.stock > 0)
    : false

  function getAvailableValues(optionName: string): Set<string> {
    const otherSelections = Object.entries(selected).filter(
      ([key]) => key !== optionName
    )

    return new Set(
      variants
        .filter(
          (v) =>
            v.is_available &&
            (v.stock === null || v.stock > 0) &&
            otherSelections.every(([key, val]) => v.options[key] === val)
        )
        .map((v) => v.options[optionName])
    )
  }

  function handleSelect(optionName: string, value: string) {
    setSelected((prev) => ({ ...prev, [optionName]: value }))
  }

  function handleAdd() {
    if (!matchedVariant || !variantInStock) return
    addItem(
      {
        productId: product.id,
        variantId: matchedVariant.id,
        name: product.name,
        variantLabel: Object.values(selected).join(" / "),
        price: matchedVariant.price,
        imageUrl: product.imageUrl,
      },
      storeSlug
    )
    track("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product_group",
      value: matchedVariant.price,
      currency: currency.toUpperCase(),
    })
    ttTrack("AddToCart", {
      content_name: product.name,
      content_id: product.id,
      content_type: "product_group",
      value: matchedVariant.price,
      currency: currency.toUpperCase(),
    })
  }

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const available = getAvailableValues(option.name)
        return (
          <div key={option.name} className="space-y-2">
            <p className="text-sm font-medium">{option.name}</p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = selected[option.name] === value
                const isAvailable = available.has(value)
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelect(option.name, value)}
                    className="rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={
                      isSelected
                        ? {
                            backgroundColor: "var(--store-accent)",
                            color: "var(--store-btn-text)",
                            borderColor: "var(--store-accent)",
                          }
                        : {
                            borderColor: "var(--store-text, #666)",
                          }
                    }
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>
          {formatPriceSymbol(displayPrice, currency)}
        </span>
        {displayCompareAtPrice && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPriceSymbol(displayCompareAtPrice, currency)}
          </span>
        )}
        {matchedVariant?.sku && (
          <span className="text-sm text-muted-foreground">{t("storefront.sku")}: {matchedVariant.sku}</span>
        )}
      </div>

      {allSelected && matchedVariant && !variantInStock && (
        <p className="text-sm text-red-500">{t("storefront.variantSoldOut")}</p>
      )}

      <Button
        onClick={handleAdd}
        size="lg"
        className="w-full"
        disabled={!allSelected || !variantInStock}
        style={getButtonStyleProps(buttonStyle)}
      >
        <ShoppingCart className="me-2 h-4 w-4" />
        {!allSelected
          ? t("storefront.selectOptions")
          : variantInStock
            ? t("storefront.addToCart")
            : t("storefront.soldOut")}
      </Button>
    </div>
  )
}
