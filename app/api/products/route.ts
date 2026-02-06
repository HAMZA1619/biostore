import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const storeId = searchParams.get("store_id")
  const collectionId = searchParams.get("collection_id")
  const page = parseInt(searchParams.get("page") || "0", 10)

  if (!storeId) {
    return NextResponse.json({ error: "store_id is required" }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("id, name, price, compare_at_price, image_urls, is_available, stock, options, product_variants(price)")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order")
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (collectionId) {
    query = query.eq("collection_id", collectionId)
  }

  const { data: products, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products: products || [],
    hasMore: (products?.length || 0) === PAGE_SIZE,
  })
}
