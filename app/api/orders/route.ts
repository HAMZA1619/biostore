import urlJoin from "url-join"
import { createClient } from "@supabase/supabase-js"
import { getImageUrl } from "@/lib/utils"
import { getExchangeRate } from "@/lib/market/exchange-rates"
import { COUNTRIES } from "@/lib/constants"
import { NextResponse } from "next/server"

export const maxDuration = 60

async function detectCountryFromIP(request: Request): Promise<string> {
  try {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : null
    if (!ip || ip === "127.0.0.1" || ip === "::1") return "Unknown"

    const res = await fetch(urlJoin("https://ipapi.co", ip, "country_name/"), {
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) return "Unknown"
    const country = await res.text()
    return country && !country.includes("error") ? country.trim() : "Unknown"
  } catch {
    return "Unknown"
  }
}

async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const secret = process.env.HCAPTCHA_SECRET_KEY
    if (!secret) return true // skip if not configured
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(60000),
      body: `response=${encodeURIComponent(token)}&secret=${encodeURIComponent(secret)}`,
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      slug,
      customer_name,
      customer_phone,
      customer_email,
      customer_city,
      customer_country,
      customer_address,
      note,
      captcha_token,
      items,
      discount_code,
      market_id,
    } = body

    if (!slug || !customer_name || !customer_phone || !customer_address || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { createAdminClient } = await import("@/lib/supabase/admin")
    const admin = createAdminClient()

    // Get store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, currency, owner_id, design_settings")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (storeError || !store) {
      console.error("[orders] Store lookup failed:", storeError)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Verify hCaptcha if enabled
    const ds = (store.design_settings || {}) as Record<string, unknown>
    const requireCaptcha = typeof ds.requireCaptcha === "boolean" ? ds.requireCaptcha : true
    if (requireCaptcha && (!captcha_token || !(await verifyCaptcha(captcha_token)))) {
      return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 })
    }

    // Resolve market for currency
    let orderCurrency = store.currency
    let orderMarketId: string | null = null
    let marketInfo: { pricing_mode: string; exchange_rate: number; price_adjustment: number } | null = null
    let marketPricesMap = new Map<string, number>()

    if (market_id) {
      const { data: market } = await supabase
        .from("markets")
        .select("id, currency, pricing_mode, price_adjustment, store_id")
        .eq("id", market_id)
        .eq("is_active", true)
        .single()

      if (market && market.store_id === store.id) {
        orderCurrency = market.currency
        orderMarketId = market.id
        const rate = market.pricing_mode === "auto"
          ? await getExchangeRate(store.currency, market.currency)
          : 1
        marketInfo = { pricing_mode: market.pricing_mode, exchange_rate: rate, price_adjustment: Number(market.price_adjustment) }
      }
    }

    // Enforce market exclusions
    if (orderMarketId) {
      const productIds = items.map((i: { product_id: string }) => i.product_id)
      const { data: exclusions } = await supabase
        .from("market_exclusions")
        .select("product_id")
        .eq("market_id", orderMarketId)
        .in("product_id", productIds)

      if (exclusions && exclusions.length > 0) {
        return NextResponse.json({ error: "Some products are not available in this market" }, { status: 400 })
      }
    }

    // Fetch products and verify prices
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image_urls, is_available, stock, status")
      .in("id", productIds)
      .eq("store_id", store.id)

    if (productsError) {
      console.error("[orders] Products fetch failed:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    if (!products || products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 })
    }

    // Verify product availability and stock for non-variant items
    for (const item of items) {
      if (!item.variant_id) {
        const product = products.find((p) => p.id === item.product_id)
        if (!product || !product.is_available || product.status !== "active") {
          return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 })
        }
        if (product.stock !== null && product.stock < item.quantity) {
          return NextResponse.json({ error: "Not enough stock for this product" }, { status: 400 })
        }
      }
    }

    // Fetch market prices for fixed-pricing markets
    if (orderMarketId && marketInfo?.pricing_mode === "fixed") {
      const { data: mPrices } = await supabase
        .from("market_prices")
        .select("product_id, variant_id, price")
        .eq("market_id", orderMarketId)
        .in("product_id", productIds)

      for (const mp of mPrices || []) {
        const key = mp.variant_id ? `${mp.product_id}:${mp.variant_id}` : mp.product_id
        marketPricesMap.set(key, Number(mp.price))
      }
    }

    // Fetch variants if any items have variant_id
    const variantIds = items
      .map((i: { variant_id?: string }) => i.variant_id)
      .filter(Boolean) as string[]

    let variantsMap: Record<string, { price: number; options: Record<string, string>; is_available: boolean; stock: number | null; product_id: string }> = {}

    if (variantIds.length > 0) {
      const { data: variants, error: varError } = await supabase
        .from("product_variants")
        .select("id, price, options, is_available, stock, product_id")
        .in("id", variantIds)

      if (varError || !variants) {
        console.error("[orders] Variants fetch failed:", varError)
        return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 })
      }

      for (const item of items) {
        if (item.variant_id) {
          const variant = variants.find((v: { id: string }) => v.id === item.variant_id)
          if (!variant || variant.product_id !== item.product_id || !variant.is_available) {
            return NextResponse.json({
              error: "Invalid or unavailable variant selection",
            }, { status: 400 })
          }
          if (variant.stock !== null && variant.stock < item.quantity) {
            return NextResponse.json({
              error: "Not enough stock for this variant",
            }, { status: 400 })
          }
        }
      }

      variantsMap = Object.fromEntries(
        variants.map((v) => [v.id, {
          price: v.price,
          options: v.options as Record<string, string>,
          is_available: v.is_available,
          stock: v.stock,
          product_id: v.product_id,
        }])
      )
    }

    // Resolve image IDs to URLs for order item snapshots
    const allImageIds = products.flatMap((p) => p.image_urls?.slice(0, 1) || [])
    const imageMap = new Map<string, string>()
    if (allImageIds.length > 0) {
      const { data: imgs } = await supabase.from("store_images").select("id, storage_path").in("id", allImageIds)
      for (const img of imgs || []) imageMap.set(img.id, getImageUrl(img.storage_path)!)
    }

    // Calculate totals with market pricing
    let subtotal = 0
    const orderItems = items.map((item: { product_id: string; variant_id?: string | null; quantity: number }) => {
      const product = products.find((p) => p.id === item.product_id)!
      const variant = item.variant_id ? variantsMap[item.variant_id] : null
      let price = variant ? variant.price : product.price

      // Apply market pricing
      if (marketInfo) {
        const marketKey = item.variant_id ? `${item.product_id}:${item.variant_id}` : item.product_id
        if (marketInfo.pricing_mode === "fixed" && marketPricesMap.has(marketKey)) {
          price = marketPricesMap.get(marketKey)!
        } else if (marketInfo.pricing_mode === "auto") {
          const multiplier = 1 + marketInfo.price_adjustment / 100
          price = Math.round(price * marketInfo.exchange_rate * multiplier * 100) / 100
        } else if (marketInfo.pricing_mode === "fixed" && !marketPricesMap.has(marketKey)) {
          // No fixed price set for this product — fall back to store base currency
          orderCurrency = store.currency
          orderMarketId = null
        }
      }

      const firstImageId = product.image_urls?.[0]

      subtotal += price * item.quantity
      return {
        product_id: product.id,
        variant_id: item.variant_id || null,
        product_name: product.name,
        product_price: price,
        variant_options: variant ? variant.options : null,
        quantity: item.quantity,
        image_url: firstImageId ? (imageMap.get(firstImageId) || null) : null,
      }
    })

    // Apply discount
    let discountId: string | null = null
    let discountAmount = 0

    if (discount_code) {
      const { data: discount } = await supabase
        .from("discounts")
        .select("*")
        .eq("store_id", store.id)
        .eq("type", "code")
        .ilike("code", discount_code.trim().replace(/%/g, "\\%").replace(/_/g, "\\_"))
        .eq("is_active", true)
        .single()

      if (discount) {
        const now = new Date()
        const valid =
          (!discount.starts_at || new Date(discount.starts_at) <= now) &&
          (!discount.ends_at || new Date(discount.ends_at) >= now) &&
          (!discount.max_uses || discount.times_used < discount.max_uses) &&
          (!discount.minimum_order_amount || subtotal >= discount.minimum_order_amount)

        if (valid) {
          if (discount.max_uses_per_customer && customer_phone) {
            const { count } = await supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("discount_id", discount.id)
              .eq("customer_phone", customer_phone)

            if (count == null || count < discount.max_uses_per_customer) {
              discountId = discount.id
            }
          } else {
            discountId = discount.id
          }

          if (discountId) {
            if (discount.discount_type === "percentage") {
              discountAmount = Math.round(subtotal * discount.discount_value / 100 * 100) / 100
            } else {
              discountAmount = discount.discount_value
            }
            discountAmount = Math.min(discountAmount, subtotal)
          }
        }
      }
    }

    // Look up shipping rate server-side
    let deliveryFee = 0
    const resolvedCountry = customer_country || await detectCountryFromIP(request)
    if (resolvedCountry) {
      const countryCode = COUNTRIES.find(
        (c) => c.name.toLowerCase() === resolvedCountry.toLowerCase()
      )?.code || ""

      // Try matching by country name first, then by country code
      let zone = null
      const { data: zoneByName } = await supabase
        .from("shipping_zones")
        .select("id, default_rate")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .ilike("country_name", resolvedCountry.replace(/%/g, "\\%").replace(/_/g, "\\_"))
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

      if (zone) {
        deliveryFee = Number(zone.default_rate)

        if (customer_city) {
          const escapedCity = customer_city.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")
          const { data: cityRate } = await supabase
            .from("shipping_city_rates")
            .select("rate, is_excluded")
            .eq("zone_id", zone.id)
            .ilike("city_name", escapedCity)
            .single()

          if (cityRate) {
            if (cityRate.is_excluded) {
              return NextResponse.json({ error: "Delivery is not available to this city" }, { status: 400 })
            }
            deliveryFee = Number(cityRate.rate)
          }
        }
      }
    }

    // Apply market exchange rate to delivery fee if auto-pricing
    if (marketInfo && marketInfo.pricing_mode === "auto" && deliveryFee > 0) {
      const multiplier = 1 + marketInfo.price_adjustment / 100
      deliveryFee = Math.round(deliveryFee * marketInfo.exchange_rate * multiplier * 100) / 100
    }

    const total = subtotal - discountAmount + deliveryFee

    // Detect country and IP
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : null
    const country = resolvedCountry

    // Insert order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        store_id: store.id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        customer_city: customer_city || null,
        customer_country: country,
        customer_address,
        payment_method: "cod",
        note: note || null,
        ip_address: ipAddress,
        subtotal,
        delivery_fee: deliveryFee,
        discount_id: discountId,
        discount_amount: discountAmount,
        total,
        market_id: orderMarketId,
        currency: orderCurrency,
      })
      .select("id, order_number")
      .single()

    if (orderError) {
      console.error("[orders] Order insert failed:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Insert order items
    const { error: itemsError } = await admin.from("order_items").insert(
      orderItems.map((item: { product_id: string; variant_id: string | null; product_name: string; product_price: number; variant_options: Record<string, string> | null; quantity: number; image_url: string | null }) => ({
        ...item,
        order_id: order.id,
      }))
    )

    if (itemsError) {
      console.error("[orders] Order items insert failed:", itemsError)
      return NextResponse.json({ error: "Order created but failed to add items" }, { status: 500 })
    }

    // Increment discount usage
    if (discountId) {
      await supabase.rpc("increment_discount_usage", { p_discount_id: discountId })
    }

    // Mark any abandoned checkout as recovered
    try {
      await admin
        .from("abandoned_checkouts")
        .update({
          status: "recovered",
          recovered_order_id: order.id,
          recovered_at: new Date().toISOString(),
        })
        .eq("store_id", store.id)
        .eq("customer_phone", customer_phone)
        .in("status", ["pending", "sent"])
    } catch {}

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      store_name: store.name,
      currency: orderCurrency,
      items: orderItems,
      total,
    })
  } catch (err) {
    console.error("[orders] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
