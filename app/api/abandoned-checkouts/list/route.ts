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

    const status = searchParams.get("status") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""

    let query = supabase
      .from("abandoned_checkouts")
      .select("id, customer_name, customer_phone, cart_items, currency, total, status, created_at")
      .eq("store_id", store.id)

    if (status) query = query.eq("status", status)
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`)
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`)

    const { data: checkouts, error } = await query
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch checkouts" }, { status: 500 })
    }

    return NextResponse.json({ checkouts: checkouts || [], hasMore: (checkouts?.length || 0) === PAGE_SIZE })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
