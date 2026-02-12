import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "0", 10)
    const integrationId = searchParams.get("integration_id") || ""

    if (!integrationId) {
      return NextResponse.json({ error: "integration_id is required" }, { status: 400 })
    }

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

    const { data: events, error } = await supabase
      .from("integration_events")
      .select("id, integration_id, event_type, payload, status, error, processed_at, created_at")
      .eq("store_id", store.id)
      .eq("integration_id", integrationId)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    return NextResponse.json({ events: events || [], hasMore: (events?.length || 0) === PAGE_SIZE })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
