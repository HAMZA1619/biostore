import { createClient } from "@/lib/supabase/server"
import { createOAuth2Client } from "@/lib/integrations/apps/google-sheets.server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const storeId = searchParams.get("state")
    const error = searchParams.get("error")

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectBase = `${appUrl}/dashboard/integrations`

    if (error) {
      return NextResponse.redirect(
        `${redirectBase}?google-sheets=error&reason=${error}`,
      )
    }

    if (!code || !storeId) {
      return NextResponse.redirect(
        `${redirectBase}?google-sheets=error&reason=missing_params`,
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${redirectBase}?google-sheets=error&reason=unauthorized`,
      )
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.redirect(
        `${redirectBase}?google-sheets=error&reason=store_not_found`,
      )
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${redirectBase}?google-sheets=error&reason=not_configured`,
      )
    }

    const oauth2 = createOAuth2Client()
    const { tokens } = await oauth2.getToken(code)

    // Verify the user granted the required scopes
    const grantedScopes = (tokens.scope || "").split(" ")
    const requiredScopes = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ]
    const missingScopes = requiredScopes.filter((s) => !grantedScopes.includes(s))
    if (missingScopes.length > 0) {
      return NextResponse.redirect(
        `${redirectBase}/google-sheets?error=insufficient_scopes`,
      )
    }

    // On reconnect, Google may not return a new refresh_token.
    // Preserve the existing one from the DB if available.
    let refreshToken = tokens.refresh_token
    if (!refreshToken) {
      const { data: existing } = await supabase
        .from("store_integrations")
        .select("config")
        .eq("store_id", storeId)
        .eq("integration_id", "google-sheets")
        .single()
      refreshToken = (existing?.config as Record<string, unknown>)?.refresh_token as string
    }

    if (!refreshToken) {
      return NextResponse.redirect(
        `${redirectBase}?google-sheets=error&reason=no_refresh_token`,
      )
    }

    const config = {
      access_token: tokens.access_token!,
      refresh_token: refreshToken,
      token_expiry: tokens.expiry_date || Date.now() + 3600 * 1000,
      connected: true,
      spreadsheet_id: "",
      spreadsheet_name: "",
      sheet_name: "Orders",
    }

    await supabase.from("store_integrations").upsert(
      {
        store_id: storeId,
        integration_id: "google-sheets",
        config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,integration_id" },
    )

    return NextResponse.redirect(`${redirectBase}/google-sheets`)
  } catch (err) {
    console.error("Google Sheets callback error:", err)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${appUrl}/dashboard/integrations?google-sheets=error&reason=unknown`,
    )
  }
}
