interface MarketEntry {
  id: string
  slug: string
  countries: string[]
  is_default: boolean
}

export function detectMarketByCountry(
  markets: MarketEntry[],
  countryCode: string | null,
): MarketEntry | null {
  if (!countryCode || markets.length === 0) return null

  const code = countryCode.toUpperCase()

  const match = markets.find((m) => m.countries?.includes(code))
  if (match) return match

  const defaultMarket = markets.find((m) => m.is_default)
  return defaultMarket || null
}
