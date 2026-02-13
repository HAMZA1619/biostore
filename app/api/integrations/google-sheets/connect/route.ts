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

    if (!process.env.GOOGLE_CLIENT_ID)
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 },
      )

    const oauth2 = createOAuth2Client()
    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
      state: store_id,
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error("Google Sheets connect error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
