import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID
    if (!productId) {
      return NextResponse.json(
        { error: "Billing not configured" },
        { status: 503 }
      )
    }

    const res = await fetch(`${POLAR_API_URL}/v1/checkouts/custom/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
        metadata: {
          user_id: user.id,
        },
        customer_email: user.email,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Polar checkout error:", err)
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 502 }
      )
    }

    const checkout = await res.json()
    return NextResponse.json({ url: checkout.url })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
