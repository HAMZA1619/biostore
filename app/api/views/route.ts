import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { storeId } = await request.json()

  if (!storeId || typeof storeId !== "string") {
    return NextResponse.json({ error: "Missing storeId" }, { status: 400 })
  }

  const supabase = await createClient()

  await supabase.from("store_views").insert({ store_id: storeId })

  return NextResponse.json({ ok: true })
}
