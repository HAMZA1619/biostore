export type RoundingRule = "none" | "0.99" | "0.95" | "0.00" | "nearest_5"

export interface MarketInfo {
  id: string
  currency: string
  pricing_mode: "fixed" | "auto"
  exchange_rate: number
  price_adjustment: number
  rounding_rule: RoundingRule
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

  // Auto mode: apply exchange rate + price adjustment
  // Fixed mode fallback (no market price set): apply exchange rate only (no adjustment)
  const rate = market.exchange_rate
  const adjustment = market.pricing_mode === "auto" ? 1 + market.price_adjustment / 100 : 1
  const rawPrice = Math.round(basePrice * rate * adjustment * 100) / 100
  const rawCompare = baseCompareAtPrice
    ? Math.round(baseCompareAtPrice * rate * adjustment * 100) / 100
    : null
  return {
    price: applyRounding(rawPrice, market.rounding_rule),
    compare_at_price: rawCompare ? applyRounding(rawCompare, market.rounding_rule) : null,
    currency: market.currency,
  }
}

export function applyRounding(price: number, rule: RoundingRule): number {
  if (rule === "none") return price
  if (rule === "0.99") return Math.round(price) - 0.01
  if (rule === "0.95") return Math.round(price) - 0.05
  if (rule === "0.00") return Math.round(price)
  if (rule === "nearest_5") return Math.ceil(price / 5) * 5
  return price
}
