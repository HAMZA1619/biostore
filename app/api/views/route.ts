import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json()

    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json({ error: "Missing storeId" }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date()
    now.setUTCMinutes(0, 0, 0)
    const hour = now.toISOString()

    const { error } = await supabase.rpc("increment_store_view", {
      p_store_id: storeId,
      p_hour: hour,
    })

    if (error) {
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
