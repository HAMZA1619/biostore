import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { marketSchema } from "@/lib/validations/market"

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

    const { data: markets } = await supabase
      .from("markets")
      .select("*")
      .eq("store_id", store.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    return NextResponse.json(markets || [])
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
    const { store_id } = body

    const parsed = marketSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }

    if (!store_id) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 })
    }

    const { name, slug, countries, currency, pricing_mode, price_adjustment, is_default, is_active } = parsed.data

    const { data: store } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 })

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from("markets")
        .update({ is_default: false })
        .eq("store_id", store_id)
        .eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("markets")
      .insert({
        store_id,
        name,
        slug,
        countries,
        currency,
        pricing_mode,
        price_adjustment,
        is_default,
        is_active,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A market with this slug already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create market" }, { status: 500 })
    }

    revalidateTag(`markets:${store_id}`, "max")
    revalidateTag(`store:${store.slug}`, "max")

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

    if (!id) return NextResponse.json({ error: "Market ID required" }, { status: 400 })

    // Verify ownership
    const { data: market } = await supabase
      .from("markets")
      .select("store_id")
      .eq("id", id)
      .single()

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("id", market.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    // Build updates from provided fields (supports partial updates like toggle)
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = body.name
    if (body.slug !== undefined) updates.slug = body.slug
    if (body.countries !== undefined) updates.countries = body.countries
    if (body.currency !== undefined) updates.currency = body.currency
    if (body.pricing_mode !== undefined) updates.pricing_mode = body.pricing_mode
    if (body.price_adjustment !== undefined) updates.price_adjustment = body.price_adjustment
    if (body.is_default !== undefined) updates.is_default = body.is_default
    if (body.is_active !== undefined) updates.is_active = body.is_active

    // If setting as default, unset other defaults
    if (body.is_default) {
      await supabase
        .from("markets")
        .update({ is_default: false })
        .eq("store_id", market.store_id)
        .eq("is_default", true)
        .neq("id", id)
    }

    const { data, error } = await supabase
      .from("markets")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A market with this slug already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to update market" }, { status: 500 })
    }

    revalidateTag(`markets:${market.store_id}`, "max")
    revalidateTag(`markets:${id}`, "max")
    revalidateTag(`store:${store.slug}`, "max")

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
    if (!id) return NextResponse.json({ error: "Market ID required" }, { status: 400 })

    const { data: market } = await supabase
      .from("markets")
      .select("store_id")
      .eq("id", id)
      .single()

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 })

    const { data: store } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("id", market.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { error } = await supabase.from("markets").delete().eq("id", id)
    if (error) return NextResponse.json({ error: "Failed to delete market" }, { status: 500 })

    revalidateTag(`markets:${market.store_id}`, "max")
    revalidateTag(`store:${store.slug}`, "max")

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
