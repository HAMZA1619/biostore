import { createStaticClient } from "@/lib/supabase/static"
import { createAdminClient } from "@/lib/supabase/admin"

const cache = new Map<string, { rates: Record<string, number>; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2 hours (primary API updates every 24h)

// ECB currencies supported by Frankfurter (~31 major pairs, most trustworthy free source)
const ECB_CURRENCIES = new Set([
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR",
  "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
])

// Tier 1: Frankfurter — official ECB rates, highest accuracy for supported pairs
async function fetchFrankfurter(from: string, to: string): Promise<number | null> {
  if (!ECB_CURRENCIES.has(from) || !ECB_CURRENCIES.has(to)) return null
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.rates?.[to] ?? null
  } catch {
    return null
  }
}

// Tier 2: ExchangeRate-API — 150+ currencies, blended central bank + commercial rates, >99.99% uptime
async function fetchPrimaryApi(from: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.rates ?? null
  } catch {
    return null
  }
}

// Tier 3: fawazahmed0 currency-api — CDN-hosted, no rate limits, 150+ currencies
async function fetchFallbackApi(from: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from.toLowerCase()}.json`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return null
    const data = await res.json()
    const nested = data[from.toLowerCase()]
    if (!nested || typeof nested !== "object") return null
    const rates: Record<string, number> = {}
    for (const [k, v] of Object.entries(nested)) {
      if (typeof v === "number") rates[k.toUpperCase()] = v
    }
    return rates
  } catch {
    return null
  }
}

function persistRates(from: string, rates: Record<string, number>) {
  try {
    const supabase = createAdminClient()
    const rows = Object.entries(rates).map(([target, rate]) => ({
      base_currency: from,
      target_currency: target,
      rate,
      updated_at: new Date().toISOString(),
    }))
    supabase
      .from("exchange_rate_cache")
      .upsert(rows, { onConflict: "base_currency,target_currency" })
      .then(() => {})
      .catch(() => {})
  } catch {
    // ignore persistence errors
  }
}

async function fetchDbCachedRate(from: string, to: string): Promise<number | null> {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from("exchange_rate_cache")
      .select("rate")
      .eq("base_currency", from)
      .eq("target_currency", to)
      .single()
    return data ? Number(data.rate) : null
  } catch {
    return null
  }
}

export async function getMarketExchangeRate(
  market: { currency: string; pricing_mode: string; manual_exchange_rate?: number | null },
  storeCurrency: string,
): Promise<number> {
  if (market.pricing_mode !== "auto") return 1
  if (market.manual_exchange_rate != null && market.manual_exchange_rate > 0) {
    return market.manual_exchange_rate
  }
  return getExchangeRate(storeCurrency, market.currency)
}

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1

  const cached = cache.get(from)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates[to] ?? 1
  }

  // Tier 1: Try Frankfurter for ECB-supported currency pairs (official institutional rates)
  const ecbRate = await fetchFrankfurter(from, to)
  if (ecbRate !== null) {
    const existing = cache.get(from)
    const rates = existing ? { ...existing.rates, [to]: ecbRate } : { [to]: ecbRate }
    cache.set(from, { rates, timestamp: Date.now() })
    persistRates(from, { [to]: ecbRate })
    return ecbRate
  }

  // Tier 2: ExchangeRate-API (all currencies, blended rates)
  let rates = await fetchPrimaryApi(from)

  if (!rates) {
    // Tier 3: fawazahmed0 CDN fallback
    console.warn(`[exchange-rates] Primary API failed for ${from}, trying CDN fallback`)
    rates = await fetchFallbackApi(from)
  }

  if (rates) {
    cache.set(from, { rates, timestamp: Date.now() })
    persistRates(from, rates)
    return rates[to] ?? 1
  }

  // Tier 4: DB cached rate (last known good)
  console.warn(`[exchange-rates] All APIs failed for ${from}→${to}, trying DB cache`)
  const dbRate = await fetchDbCachedRate(from, to)
  if (dbRate !== null) {
    return dbRate
  }

  console.warn(`[exchange-rates] All sources failed for ${from}→${to}, returning 1`)
  return 1
}
