import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: checkout } = await supabase
    .from("abandoned_checkouts")
    .select("*, stores!inner(slug, custom_domain, domain_verified)")
    .eq("id", id)
    .single()

  if (!checkout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (checkout.status === "expired") {
    return NextResponse.json({ error: "Expired" }, { status: 410 })
  }

  const store = checkout.stores as unknown as {
    slug: string
    custom_domain: string | null
    domain_verified: boolean
  }

  return NextResponse.json({
    slug: store.slug,
    currency: checkout.currency,
    cart_items: checkout.cart_items,
    customer_name: checkout.customer_name,
    customer_phone: checkout.customer_phone,
    customer_email: checkout.customer_email,
    customer_country: checkout.customer_country,
    customer_city: checkout.customer_city,
    customer_address: checkout.customer_address,
  })
}
