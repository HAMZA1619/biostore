import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "0", 10)
    const q = searchParams.get("q") || ""

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    let query = supabase
      .from("products")
      .select("id, name, sku, price, status, collections(name), product_variants(id)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (q.trim()) {
      query = query.ilike("name", `%${q.trim()}%`)
    }

    const { data: products, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json({ products: products || [], hasMore: (products?.length || 0) === PAGE_SIZE })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
