import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const POLAR_API_URL = process.env.POLAR_API_URL || "https://api.polar.sh"

export async function GET() {
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
      .select("polar_customer_id")
      .eq("id", user.id)
      .single()

    if (!profile?.polar_customer_id) {
      return NextResponse.json({ orders: [] })
    }

    const url = new URL(`${POLAR_API_URL}/v1/orders/`)
    url.searchParams.set("customer_id", profile.polar_customer_id)
    url.searchParams.set("sorting", "-created_at")
    url.searchParams.set("limit", "50")

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      },
    })

    if (!res.ok) {
      console.error("Polar orders error:", await res.text())
      return NextResponse.json({ orders: [] })
    }

    const data = await res.json()

    const orders = (data.items ?? []).map(
      (o: Record<string, unknown>) => ({
        id: o.id,
        created_at: o.created_at,
        amount: o.total_amount,
        currency: o.currency,
        status: o.status,
        billing_reason: o.billing_reason,
      })
    )

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
