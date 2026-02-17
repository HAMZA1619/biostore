import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { store_id } = body

    if (!store_id) {
      return NextResponse.json(
        { error: "Missing store_id" },
        { status: 400 }
      )
    }

    const { data: integration } = await supabase
      .from("store_integrations")
      .select("config")
      .eq("store_id", store_id)
      .eq("integration_id", "whatsapp")
      .single()

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      )
    }

    const config = integration.config as { instance_name?: string }
    if (config.instance_name) {
      const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "")
      const evolutionKey = process.env.EVOLUTION_API_KEY

      if (evolutionUrl && evolutionKey) {
        await fetch(
          `${evolutionUrl}/instance/logout/${config.instance_name}`,
          {
            method: "DELETE",
            headers: { apikey: evolutionKey },
            signal: AbortSignal.timeout(10000),
          }
        ).catch(() => {})

        await fetch(
          `${evolutionUrl}/instance/delete/${config.instance_name}`,
          {
            method: "DELETE",
            headers: { apikey: evolutionKey },
            signal: AbortSignal.timeout(10000),
          }
        ).catch(() => {})
      }
    }

    await supabase
      .from("store_integrations")
      .update({
        config: { instance_name: null, connected: false },
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", store_id)
      .eq("integration_id", "whatsapp")

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
