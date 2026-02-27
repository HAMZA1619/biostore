import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    const { data: discounts, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 })

    return NextResponse.json(discounts)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { store_id, code, label, discount_type, discount_value, minimum_order_amount, max_uses, max_uses_per_customer, starts_at, ends_at, is_active } = body

    if (!store_id || !discount_type || !discount_value) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const { data, error } = await supabase
      .from("discounts")
      .insert({
        store_id,
        type: "code",
        code: code ? code.toUpperCase().trim() : null,
        label: label || (code ? code.toUpperCase().trim() : ""),
        discount_type,
        discount_value,
        minimum_order_amount: minimum_order_amount || null,
        max_uses: max_uses || null,
        max_uses_per_customer: max_uses_per_customer || null,
        starts_at: starts_at || null,
        ends_at: ends_at || null,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A discount with this code already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to save discount" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "Missing discount id" }, { status: 400 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const ALLOWED_FIELDS = ["code", "label", "discount_type", "discount_value", "minimum_order_amount", "max_uses", "max_uses_per_customer", "is_active", "starts_at", "ends_at"] as const
    const fields: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body) fields[key] = body[key]
    }
    if (typeof fields.code === "string") {
      fields.code = fields.code.toUpperCase().trim()
    }

    const { data, error } = await supabase
      .from("discounts")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("store_id", store.id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A discount with this code already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to save discount" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Missing discount id" }, { status: 400 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const { error } = await supabase
      .from("discounts")
      .delete()
      .eq("id", id)
      .eq("store_id", store.id)

    if (error) return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
