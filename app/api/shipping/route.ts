import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { shippingZoneSchema } from "@/lib/validations/shipping"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const { data: zones } = await supabase
      .from("shipping_zones")
      .select("*, shipping_city_rates(*)")
      .eq("store_id", store.id)
      .order("country_name")

    return NextResponse.json(zones || [])
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = shippingZoneSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const { country_code, country_name, default_rate, is_active } = parsed.data

    const { data, error } = await supabase
      .from("shipping_zones")
      .insert({
        store_id: store.id,
        country_code,
        country_name,
        default_rate,
        is_active,
      })
      .select("*, shipping_city_rates(*)")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A shipping zone for this country already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create shipping zone" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "Zone ID required" }, { status: 400 })

    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("store_id")
      .eq("id", id)
      .single()

    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", zone.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.default_rate !== undefined) updates.default_rate = body.default_rate
    if (body.is_active !== undefined) updates.is_active = body.is_active

    const { data, error } = await supabase
      .from("shipping_zones")
      .update(updates)
      .eq("id", id)
      .select("*, shipping_city_rates(*)")
      .single()

    if (error) return NextResponse.json({ error: "Failed to update zone" }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Zone ID required" }, { status: 400 })

    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("store_id")
      .eq("id", id)
      .single()

    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", zone.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { error } = await supabase.from("shipping_zones").delete().eq("id", id)
    if (error) return NextResponse.json({ error: "Failed to delete zone" }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
