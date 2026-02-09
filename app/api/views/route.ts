import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json()

    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json({ error: "Missing storeId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("store_views").insert({ store_id: storeId })

    if (error) {
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
