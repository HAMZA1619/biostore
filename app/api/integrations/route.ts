import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { store_id, integration_id } = body

    if (!store_id || !integration_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("store_integrations")
      .upsert(
        {
          store_id,
          integration_id,
          config: body.config || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id,integration_id" }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to save integration" }, { status: 500 })
    }

    revalidateTag(`integrations:${store_id}`, "max")
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, config } = body

    if (!id) {
      return NextResponse.json(
        { error: "Missing integration id" },
        { status: 400 }
      )
    }

    // Verify integration belongs to a store owned by the current user
    const { data: existing } = await supabase
      .from("store_integrations")
      .select("config, store_id, stores!inner(owner_id)")
      .eq("id", id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    const owner = (existing.stores as unknown as { owner_id: string })
    if (owner.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (config) {
      if (existing.config && typeof existing.config === "object") {
        updates.config = { ...(existing.config as Record<string, unknown>), ...config }
      } else {
        updates.config = config
      }
    }

    const { data, error } = await supabase
      .from("store_integrations")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update integration" }, { status: 500 })
    }

    revalidateTag(`integrations:${existing.store_id}`, "max")
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing integration id" },
        { status: 400 }
      )
    }

    // Verify integration belongs to a store owned by the current user
    const { data: integration } = await supabase
      .from("store_integrations")
      .select("store_id, stores!inner(owner_id)")
      .eq("id", id)
      .single()

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    const owner = (integration.stores as unknown as { owner_id: string })
    if (owner.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("store_integrations")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete integration" }, { status: 500 })
    }

    revalidateTag(`integrations:${integration.store_id}`, "max")
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
