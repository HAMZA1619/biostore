import urlJoin from "url-join"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("store_id")

    if (!storeId) {
      return NextResponse.json(
        { error: "Missing store_id" },
        { status: 400 }
      )
    }

    const instanceNameParam = searchParams.get("instance_name")

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("owner_id", user.id)
      .single()

    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })

    // Try DB first, fall back to query param (pre-install polling)
    const { data: integration } = await supabase
      .from("store_integrations")
      .select("config")
      .eq("store_id", storeId)
      .eq("integration_id", "whatsapp")
      .single()

    const config = (integration?.config || {}) as { instance_name?: string; connected?: boolean; enabled_events?: string[] }
    const instanceName = config.instance_name || instanceNameParam

    if (!instanceName) {
      return NextResponse.json({ connected: false, instance_exists: false })
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL
    const evolutionKey = process.env.EVOLUTION_API_KEY
    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json(
        { error: "Evolution API not configured" },
        { status: 500 }
      )
    }

    const stateRes = await fetch(
      urlJoin(evolutionUrl, "instance/connectionState", instanceName),
      {
        headers: { apikey: evolutionKey },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!stateRes.ok) {
      return NextResponse.json({ connected: false, instance_exists: true })
    }

    const stateData = await stateRes.json()
    const connected = stateData.instance?.state === "open"

    if (connected) {
      await supabase
        .from("store_integrations")
        .upsert(
          {
            store_id: storeId,
            integration_id: "whatsapp",
            config: {
              ...config,
              instance_name: instanceName,
              connected: true,
              enabled_events: config.enabled_events ?? ["order.created"],
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id,integration_id" }
        )
    }

    return NextResponse.json({
      connected,
      instance_exists: true,
      state: stateData.instance?.state,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
