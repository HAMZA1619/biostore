import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10) || 0)

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

    const search = searchParams.get("search")?.trim() || ""

    let query = supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_country, total, currency, status, created_at")
      .eq("store_id", store.id)

    if (search) {
      const orderNum = parseInt(search.replace(/^#/, ""), 10)
      if (!isNaN(orderNum)) {
        query = query.eq("order_number", orderNum)
      } else {
        const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_")
        query = query.or(`customer_name.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%`)
      }
    }

    const { data: orders, error } = await query
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [], hasMore: (orders?.length || 0) === PAGE_SIZE })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
