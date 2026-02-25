import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const marketId = request.nextUrl.searchParams.get("market_id")
    if (!marketId) return NextResponse.json({ error: "market_id required" }, { status: 400 })

    const { data: market } = await supabase
      .from("markets")
      .select("id, store_id")
      .eq("id", marketId)
      .single()

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", market.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { data: exclusions } = await supabase
      .from("market_exclusions")
      .select("product_id")
      .eq("market_id", marketId)

    return NextResponse.json((exclusions || []).map((e) => e.product_id))
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { market_id, excluded_product_ids } = await request.json()
    if (!market_id) return NextResponse.json({ error: "market_id required" }, { status: 400 })

    const { data: market } = await supabase
      .from("markets")
      .select("id, store_id")
      .eq("id", market_id)
      .single()

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("id", market.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { error: deleteError } = await supabase
      .from("market_exclusions")
      .delete()
      .eq("market_id", market_id)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to clear existing exclusions" }, { status: 500 })
    }

    const ids: string[] = excluded_product_ids || []
    if (ids.length > 0) {
      const rows = ids.map((product_id) => ({ market_id, product_id }))
      const { error: insertError } = await supabase.from("market_exclusions").insert(rows)
      if (insertError) {
        return NextResponse.json({ error: "Failed to save exclusions" }, { status: 500 })
      }
    }

    revalidateTag(`market-exclusions:${market_id}`, "max")
    revalidateTag(`products:${store.id}`, "max")
    revalidateTag(`store:${store.slug}`, "max")

    return NextResponse.json({ ok: true, count: ids.length })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
