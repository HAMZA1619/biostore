import urlJoin from "url-join"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60

const POLAR_API_URL = process.env.POLAR_API_URL || "https://api.polar.sh"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("polar_subscription_id")
      .eq("id", user.id)
      .single()

    if (!profile?.polar_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      )
    }

    const res = await fetch(
      urlJoin(POLAR_API_URL, "v1/subscriptions", profile.polar_subscription_id),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancel_at_period_end: true,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error("Polar cancel error:", err)
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
