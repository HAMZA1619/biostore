import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { domainSchema } from "@/lib/validations/domain"
import {
  addDomainToVercel,
  getDomainFromVercel,
  removeDomainFromVercel,
} from "@/lib/vercel"

export async function GET() {
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
      .select("id, custom_domain, domain_verified")
      .eq("owner_id", user.id)
      .single()

    if (!store || !store.custom_domain) {
      return NextResponse.json({ domain: null })
    }

    const vercel = await getDomainFromVercel(store.custom_domain)

    return NextResponse.json({
      domain: store.custom_domain,
      verified: store.domain_verified,
      vercel: vercel.ok ? vercel.data : null,
    })
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

    const { data: store } = await supabase
      .from("stores")
      .select("id, custom_domain")
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

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

    // Remove old domain from Vercel if changing
    if (store.custom_domain && store.custom_domain !== domain) {
      await removeDomainFromVercel(store.custom_domain)
    }

    // Add domain to Vercel project
    const vercel = await addDomainToVercel(domain)
    if (!vercel.ok && vercel.status !== 409) {
      return NextResponse.json(
        { error: "domain.vercelError" },
        { status: 502 }
      )
    }

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

    return NextResponse.json({
      success: true,
      domain,
      vercel: vercel.data,
    })
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
      .select("id, custom_domain")
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Remove from Vercel
    if (store.custom_domain) {
      await removeDomainFromVercel(store.custom_domain)
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
