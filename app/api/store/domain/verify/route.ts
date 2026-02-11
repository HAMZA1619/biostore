import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyDomainOnVercel } from "@/lib/vercel"

export async function POST() {
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

    if (!store || !store.custom_domain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 }
      )
    }

    const result = await verifyDomainOnVercel(store.custom_domain)
    const verified = result.data?.verified === true

    if (verified) {
      await supabase
        .from("stores")
        .update({ domain_verified: true })
        .eq("id", store.id)
    }

    return NextResponse.json({
      verified,
      verification: result.data?.verification ?? null,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
