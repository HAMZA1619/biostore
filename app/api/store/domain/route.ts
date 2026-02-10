import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { domainSchema } from "@/lib/validations/domain"

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = domainSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "domain.invalidDomain" },
        { status: 400 }
      )
    }

    const { domain } = parsed.data

    // Get user's store
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Check if domain is already taken by another store
    const { data: existing } = await supabase
      .from("stores")
      .select("id")
      .eq("custom_domain", domain)
      .neq("id", store.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "domain.domainTaken" },
        { status: 409 }
      )
    }

    // Update store with new domain
    const { error } = await supabase
      .from("stores")
      .update({ custom_domain: domain, domain_verified: false })
      .eq("id", store.id)

    if (error) {
      return NextResponse.json(
        { error: "Failed to save domain" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, domain })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
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

    const { error } = await supabase
      .from("stores")
      .update({ custom_domain: null, domain_verified: false })
      .eq("id", store.id)

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove domain" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
