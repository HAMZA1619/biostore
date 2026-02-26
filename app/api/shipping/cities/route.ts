import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { zone_id, city_name, rate, is_excluded, cities } = body

    if (!zone_id) {
      return NextResponse.json({ error: "zone_id is required" }, { status: 400 })
    }

    // Verify ownership
    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("store_id")
      .eq("id", zone_id)
      .single()

    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", zone.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    // Bulk mode: { zone_id, cities: [{ city_name, rate, is_excluded }] }
    if (Array.isArray(cities)) {
      const validCities = cities.filter((c: { city_name?: string }) => c.city_name?.trim())

      // Validate: rate required when not excluded
      for (const c of validCities) {
        if (!c.is_excluded && (c.rate === null || c.rate === undefined || c.rate < 0)) {
          return NextResponse.json({ error: "Rate is required when city is not excluded" }, { status: 400 })
        }
      }

      const rows = validCities
        .map((c: { city_name: string; rate?: number | null; is_excluded?: boolean }) => ({
          zone_id,
          city_name: c.city_name.trim(),
          rate: c.is_excluded ? null : c.rate,
          is_excluded: !!c.is_excluded,
        }))

      if (rows.length === 0) {
        return NextResponse.json({ error: "No valid cities provided" }, { status: 400 })
      }

      const { data, error } = await supabase
        .from("shipping_city_rates")
        .upsert(rows, { onConflict: "zone_id,city_name" })
        .select()

      if (error) return NextResponse.json({ error: "Failed to save city rates" }, { status: 500 })

      return NextResponse.json(data)
    }

    // Single mode (backward compatible)
    if (!city_name?.trim()) {
      return NextResponse.json({ error: "city_name is required" }, { status: 400 })
    }

    if (!is_excluded && (rate === null || rate === undefined || rate < 0)) {
      return NextResponse.json({ error: "Rate is required when city is not excluded" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("shipping_city_rates")
      .upsert(
        {
          zone_id,
          city_name: city_name.trim(),
          rate: is_excluded ? null : rate,
          is_excluded: !!is_excluded,
        },
        { onConflict: "zone_id,city_name" }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: "Failed to save city rate" }, { status: 500 })

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
    if (!id) return NextResponse.json({ error: "City rate ID required" }, { status: 400 })

    const { data: cityRate } = await supabase
      .from("shipping_city_rates")
      .select("zone_id")
      .eq("id", id)
      .single()

    if (!cityRate) return NextResponse.json({ error: "City rate not found" }, { status: 404 })

    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("store_id")
      .eq("id", cityRate.zone_id)
      .single()

    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", zone.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { error } = await supabase.from("shipping_city_rates").delete().eq("id", id)
    if (error) return NextResponse.json({ error: "Failed to delete city rate" }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
