const cache = new Map<string, { rates: Record<string, number>; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1

  const cached = cache.get(from)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates[to] ?? 1
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 1
    const data = await res.json()
    if (data.rates) {
      cache.set(from, { rates: data.rates, timestamp: Date.now() })
      return data.rates[to] ?? 1
    }
    return 1
  } catch {
    return 1
  }
}
