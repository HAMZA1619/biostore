import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import dns from "node:dns/promises"

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

    const domain = store.custom_domain
    let verified = false

    // Check if CNAME or A record points to our server
    const appHostname = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : null
    const serverIp = process.env.APP_SERVER_IP || null

    // Try CNAME check
    try {
      const cnames = await dns.resolveCname(domain)
      if (appHostname && cnames.some((c) => c === appHostname || c.endsWith(`.${appHostname}`))) {
        verified = true
      }
    } catch {
      // CNAME not found, try A record
    }

    // Try A record check
    if (!verified && serverIp) {
      try {
        const addresses = await dns.resolve4(domain)
        if (addresses.includes(serverIp)) {
          verified = true
        }
      } catch {
        // A record not found
      }
    }

    if (verified) {
      await supabase
        .from("stores")
        .update({ domain_verified: true })
        .eq("id", store.id)
    }

    return NextResponse.json({ verified })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
