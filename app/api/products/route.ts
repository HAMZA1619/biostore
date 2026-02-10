import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const storeId = searchParams.get("store_id")
    const collectionId = searchParams.get("collection_id")
    const search = searchParams.get("search")
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

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data: rawProducts, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Resolve image IDs to URLs
    const allImageIds = (rawProducts || []).flatMap((p) => p.image_urls || [])
    const imageMap = new Map<string, string>()
    if (allImageIds.length > 0) {
      const { data: imgs } = await supabase.from("store_images").select("id, url").in("id", allImageIds)
      for (const img of imgs || []) imageMap.set(img.id, img.url)
    }
    const products = (rawProducts || []).map((p) => ({
      ...p,
      image_urls: (p.image_urls || []).map((id: string) => imageMap.get(id)).filter(Boolean) as string[],
    }))

    return NextResponse.json({
      products,
      hasMore: (rawProducts?.length || 0) === PAGE_SIZE,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
