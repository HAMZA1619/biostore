import { createClient } from "@supabase/supabase-js"
import { getExchangeRate } from "@/lib/market/exchange-rates"
import { NextRequest, NextResponse } from "next/server"
import { COUNTRIES } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const slug = searchParams.get("slug")
    const country = searchParams.get("country")
    const city = searchParams.get("city")
    const marketId = searchParams.get("market_id")

    if (!slug || !country) {
      return NextResponse.json({ delivery_fee: 0, has_shipping: false, excluded: false, currency: null, cities: [] })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: store } = await supabase
      .from("stores")
      .select("id, currency")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (!store) {
      return NextResponse.json({ delivery_fee: 0, has_shipping: false, excluded: false, currency: null, cities: [] })
    }

    // Resolve market for delivery fee conversion
    let marketRate = 1
    let marketAdjustment = 0
    let shouldConvert = false
    let shippingCurrency = store.currency

    if (marketId) {
      const { data: market } = await supabase
        .from("markets")
        .select("id, currency, pricing_mode, price_adjustment, store_id")
        .eq("id", marketId)
        .eq("is_active", true)
        .single()

      if (market && market.store_id === store.id) {
        shippingCurrency = market.currency
        if (market.pricing_mode === "auto") {
          marketRate = await getExchangeRate(store.currency, market.currency)
          marketAdjustment = Number(market.price_adjustment)
          shouldConvert = true
        }
      }
    }

    function convertFee(fee: number): number {
      if (!shouldConvert || fee === 0) return fee
      const multiplier = 1 + marketAdjustment / 100
      return Math.round(fee * marketRate * multiplier * 100) / 100
    }

    // Try matching by country name first, then by country code
    const countryCode = COUNTRIES.find(
      (c) => c.name.toLowerCase() === country.toLowerCase()
    )?.code

    let zone = null
    const { data: zoneByName } = await supabase
      .from("shipping_zones")
      .select("id, default_rate")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .ilike("country_name", country.replace(/%/g, "\\%").replace(/_/g, "\\_"))
      .single()

    if (zoneByName) {
      zone = zoneByName
    } else if (countryCode) {
      const { data: zoneByCode } = await supabase
        .from("shipping_zones")
        .select("id, default_rate")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .eq("country_code", countryCode)
        .single()
      zone = zoneByCode
    }

    if (!zone) {
      return NextResponse.json({ delivery_fee: 0, has_shipping: false, excluded: false, currency: shippingCurrency, cities: [] })
    }

    // Fetch all configured city names for autocomplete
    const { data: allCityRates } = await supabase
      .from("shipping_city_rates")
      .select("city_name")
      .eq("zone_id", zone.id)
      .order("city_name")

    const cities = (allCityRates || []).map((c) => c.city_name)

    // Check for city-specific rate
    if (city?.trim()) {
      const escapedCity = city.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")
      const { data: cityRate } = await supabase
        .from("shipping_city_rates")
        .select("rate, is_excluded")
        .eq("zone_id", zone.id)
        .ilike("city_name", escapedCity)
        .single()

      if (cityRate) {
        if (cityRate.is_excluded) {
          return NextResponse.json({ delivery_fee: null, has_shipping: true, excluded: true, currency: shippingCurrency, cities })
        }
        return NextResponse.json({
          delivery_fee: convertFee(Number(cityRate.rate)),
          has_shipping: true,
          excluded: false,
          currency: shippingCurrency,
          cities,
        })
      }
    }

    return NextResponse.json({
      delivery_fee: convertFee(Number(zone.default_rate)),
      has_shipping: true,
      excluded: false,
      currency: shippingCurrency,
      cities,
    })
  } catch {
    return NextResponse.json({ delivery_fee: 0, has_shipping: false, excluded: false, currency: null, cities: [] })
  }
}
