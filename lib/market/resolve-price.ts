export interface MarketInfo {
  id: string
  currency: string
  pricing_mode: "fixed" | "auto"
  exchange_rate: number
  price_adjustment: number
}

export interface MarketPriceRow {
  product_id: string
  variant_id: string | null
  price: number
  compare_at_price: number | null
}

export interface ResolvedPrice {
  price: number
  compare_at_price: number | null
  currency: string
}

export function resolvePrice(
  basePrice: number,
  baseCompareAtPrice: number | null,
  baseCurrency: string,
  market: MarketInfo | null,
  marketPrice: Pick<MarketPriceRow, "price" | "compare_at_price"> | null,
): ResolvedPrice {
  if (!market) {
    return { price: basePrice, compare_at_price: baseCompareAtPrice, currency: baseCurrency }
  }

  if (market.pricing_mode === "fixed" && marketPrice) {
    return {
      price: marketPrice.price,
      compare_at_price: marketPrice.compare_at_price,
      currency: market.currency,
    }
  }

  if (market.pricing_mode === "auto") {
    const rate = market.exchange_rate
    const adjustment = 1 + market.price_adjustment / 100
    const adjustedPrice = Math.round(basePrice * rate * adjustment * 100) / 100
    const adjustedCompare = baseCompareAtPrice
      ? Math.round(baseCompareAtPrice * rate * adjustment * 100) / 100
      : null
    return {
      price: adjustedPrice,
      compare_at_price: adjustedCompare,
      currency: market.currency,
    }
  }

  return { price: basePrice, compare_at_price: baseCompareAtPrice, currency: baseCurrency }
}
