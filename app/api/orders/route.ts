import { createClient } from "@supabase/supabase-js"
import { getImageUrl } from "@/lib/utils"
import { NextResponse } from "next/server"

async function detectCountryFromIP(request: Request): Promise<string> {
  try {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : null
    if (!ip || ip === "127.0.0.1" || ip === "::1") return "Unknown"

    const res = await fetch(`https://ipapi.co/${ip}/country_name/`, {
      signal: AbortSignal.timeout(3000),
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
    } = body

    if (!slug || !customer_name || !customer_phone || !customer_address || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify hCaptcha
    if (!captcha_token || !(await verifyCaptcha(captcha_token))) {
      return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, currency, owner_id")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Fetch products and verify prices
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image_urls, is_available, stock, status")
      .in("id", productIds)
      .eq("store_id", store.id)

    if (productsError) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    if (!products || products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 })
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

    // Calculate totals
    let subtotal = 0
    const orderItems = items.map((item: { product_id: string; variant_id?: string | null; quantity: number }) => {
      const product = products.find((p) => p.id === item.product_id)!
      const variant = item.variant_id ? variantsMap[item.variant_id] : null
      const price = variant ? variant.price : product.price
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

    const total = subtotal

    // Detect country from IP if not provided
    const country = customer_country || await detectCountryFromIP(request)

    // Insert order
    const { data: order, error: orderError } = await supabase
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
        subtotal,
        total,
      })
      .select("id, order_number")
      .single()

    if (orderError) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Insert order items
    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map((item: { product_id: string; variant_id: string | null; product_name: string; product_price: number; variant_options: Record<string, string> | null; quantity: number; image_url: string | null }) => ({
        ...item,
        order_id: order.id,
      }))
    )

    if (itemsError) {
      return NextResponse.json({ error: "Order created but failed to add items" }, { status: 500 })
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      store_name: store.name,
      currency: store.currency,
      items: orderItems,
      total,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
