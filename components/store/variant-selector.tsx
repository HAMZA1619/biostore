"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { usePixel } from "@/lib/hooks/use-pixel"
import { useTiktokPixel } from "@/lib/hooks/use-tiktok-pixel"
import { useMarket } from "@/lib/hooks/use-market"
import { Button } from "@/components/ui/button"
import { formatPriceSymbol } from "@/lib/utils"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { useButtonStyle, useButtonSize, getButtonStyleProps } from "@/lib/hooks/use-button-style"
import { useStoreConfig } from "@/lib/store/store-config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

function isVariantInStock(v: Variant): boolean {
  return v.is_available && (v.stock === null || v.stock > 0)
}

export function VariantSelector({ product, options, variants, storeSlug }: VariantSelectorProps) {
  const { t } = useTranslation()
  const addItem = useCartStore((s) => s.addItem)
  const track = usePixel()
  const ttTrack = useTiktokPixel()
  const currency = useStoreCurrency()
  const market = useMarket()
  const buttonStyle = useButtonStyle()
  const buttonSize = useButtonSize()
  const config = useStoreConfig()
  const variantStyle = config?.variantStyle || "buttons"
  const [selected, setSelected] = useState<Record<string, string>>({})

  const allSelected = options.every((o) => selected[o.name])
  const anyAvailable = variants.some(isVariantInStock)

  const matchedVariant = allSelected
    ? variants.find((v) =>
        options.every((o) => v.options[o.name] === selected[o.name])
      )
    : null

  const displayPrice = matchedVariant ? matchedVariant.price : product.price
  const displayCompareAtPrice = matchedVariant?.compare_at_price ?? null
  const variantInStock = matchedVariant ? isVariantInStock(matchedVariant) : false

  function getAvailableValues(optionName: string): Set<string> {
    const otherSelections = Object.entries(selected).filter(
      ([key]) => key !== optionName
    )

    return new Set(
      variants
        .filter(
          (v) =>
            isVariantInStock(v) &&
            otherSelections.every(([key, val]) => v.options[key] === val)
        )
        .map((v) => v.options[optionName])
    )
  }

  function handleSelect(optionName: string, value: string) {
    // Toggle: clicking the same option deselects it
    if (selected[optionName] === value) {
      setSelected((prev) => {
        const next = { ...prev }
        delete next[optionName]
        return next
      })
      return
    }
    setSelected((prev) => ({ ...prev, [optionName]: value }))
  }

  function handleDropdownChange(optionName: string, value: string) {
    // For dropdown, use "__clear__" as a sentinel to deselect
    if (value === "__clear__") {
      setSelected((prev) => {
        const next = { ...prev }
        delete next[optionName]
        return next
      })
      return
    }
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
      storeSlug,
      market?.slug
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
      {!anyAvailable && (
        <p className="text-sm font-medium text-red-500">{t("storefront.allVariantsSoldOut")}</p>
      )}

      {options.map((option) => {
        const available = getAvailableValues(option.name)
        return (
          <div key={option.name} className="space-y-2">
            <p className="text-sm font-medium">
              {option.name}
              {selected[option.name] && (
                <span className="ms-1 font-normal text-muted-foreground">: {selected[option.name]}</span>
              )}
            </p>
            {variantStyle === "dropdown" ? (
              <Select
                value={selected[option.name] || ""}
                onValueChange={(value) => handleDropdownChange(option.name, value)}
              >
                <SelectTrigger className="w-full" style={{ borderRadius: buttonStyle === "pill" ? "9999px" : "var(--store-radius)" }}>
                  <SelectValue placeholder={`${t("storefront.select")} ${option.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {selected[option.name] && (
                    <SelectItem value="__clear__" className="text-muted-foreground">
                      {t("storefront.clearSelection")}
                    </SelectItem>
                  )}
                  {option.values.map((value) => {
                    const isAvailable = available.has(value)
                    return (
                      <SelectItem key={value} value={value} disabled={!isAvailable}>
                        {value}{!isAvailable ? ` (${t("storefront.soldOut")})` : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selected[option.name] === value
                  const isAvailable = available.has(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!isAvailable && !isSelected}
                      onClick={() => handleSelect(option.name, value)}
                      className="border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderRadius: buttonStyle === "pill" ? "9999px" : "var(--store-radius, 6px)",
                        ...(isSelected
                          ? isAvailable
                            ? buttonStyle === "outline"
                              ? {
                                  backgroundColor: "transparent",
                                  color: "var(--store-accent)",
                                  borderColor: "var(--store-accent)",
                                  borderWidth: "1.5px",
                                }
                              : {
                                  backgroundColor: "var(--store-accent)",
                                  color: "var(--store-btn-text)",
                                  borderColor: "var(--store-accent)",
                                }
                            : {
                                backgroundColor: buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
                                color: buttonStyle === "outline" ? "var(--store-accent)" : "var(--store-btn-text)",
                                borderColor: "var(--store-accent)",
                                opacity: 0.6,
                              }
                          : {
                              borderColor: "var(--store-text, #666)",
                            }),
                      }}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            )}
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
        {config?.showProductSku !== false && matchedVariant?.sku && (
          <span className="text-sm text-muted-foreground">{t("storefront.sku")}: {matchedVariant.sku}</span>
        )}
      </div>

      {allSelected && matchedVariant && !variantInStock && (
        <p className="text-sm text-red-500">{t("storefront.variantSoldOut")}</p>
      )}

      <Button
        onClick={handleAdd}
        size={buttonSize}
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
