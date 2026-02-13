import { createClient } from "@/lib/supabase/server"
import { createOAuth2Client } from "@/lib/integrations/apps/google-sheets.server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { store_id } = await request.json()
    if (!store_id)
      return NextResponse.json({ error: "Missing store_id" }, { status: 400 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const { data: integration } = await supabase
      .from("store_integrations")
      .select("id, config")
      .eq("store_id", store_id)
      .eq("integration_id", "google-sheets")
      .single()

    if (!integration)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      )

    const config = integration.config as Record<string, unknown>

    if (config.access_token) {
      try {
        const oauth2 = createOAuth2Client()
        await oauth2.revokeToken(config.access_token as string)
      } catch {
        // Ignore revocation errors
      }
    }

    await supabase
      .from("store_integrations")
      .update({
        config: { connected: false },
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Google Sheets disconnect error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
