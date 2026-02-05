import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      slug,
      customer_name,
      customer_phone,
      customer_city,
      customer_address,
      payment_method,
      note,
      items,
    } = body

    if (!slug || !customer_name || !customer_phone || !customer_city || !customer_address || !items?.length) {
      return NextResponse.json({
        error: "Missing required fields",
        debug: { slug: !!slug, customer_name: !!customer_name, customer_phone: !!customer_phone, customer_city: !!customer_city, customer_address: !!customer_address, items: items?.length || 0 },
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, phone, owner_id")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (storeError || !store) {
      return NextResponse.json({
        error: "Store not found",
        debug: { slug, storeError: storeError?.message, storeCode: storeError?.code },
      }, { status: 404 })
    }

    // Fetch products and verify prices
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image_urls, is_available")
      .in("id", productIds)
      .eq("store_id", store.id)

    if (productsError) {
      return NextResponse.json({
        error: "Failed to fetch products",
        debug: { productsError: productsError.message, productsCode: productsError.code },
      }, { status: 500 })
    }

    if (!products || products.length !== items.length) {
      return NextResponse.json({
        error: "Some products are unavailable",
        debug: { requested: items.length, found: products?.length || 0, productIds },
      }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = items.map((item: { product_id: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.product_id)!
      subtotal += product.price * item.quantity
      return {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        image_url: product.image_urls?.[0] || null,
      }
    })

    const total = subtotal

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        customer_name,
        customer_phone,
        customer_city,
        customer_address,
        payment_method: payment_method || "cod",
        note: note || null,
        subtotal,
        total,
      })
      .select("id, order_number")
      .single()

    if (orderError) {
      return NextResponse.json({
        error: "Failed to create order",
        debug: { orderError: orderError.message, orderCode: orderError.code, orderHint: orderError.hint },
      }, { status: 500 })
    }

    // Insert order items
    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map((item: { product_id: string; product_name: string; product_price: number; quantity: number; image_url: string | null }) => ({
        ...item,
        order_id: order.id,
      }))
    )

    if (itemsError) {
      return NextResponse.json({
        error: "Order created but failed to add items",
        debug: { itemsError: itemsError.message, itemsCode: itemsError.code },
      }, { status: 500 })
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      store_phone: store.phone,
      store_name: store.name,
      items: orderItems,
      total,
    })
  } catch (err) {
    return NextResponse.json({
      error: "Internal server error",
      debug: { message: err instanceof Error ? err.message : String(err) },
    }, { status: 500 })
  }
}
