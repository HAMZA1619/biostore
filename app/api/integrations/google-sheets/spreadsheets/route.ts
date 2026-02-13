import { createClient } from "@/lib/supabase/server"
import {
  refreshAccessToken,
  getHeaders,
  getAuthenticatedClient,
  getSheetsClient,
} from "@/lib/integrations/apps/google-sheets.server"
import { NextResponse } from "next/server"

async function getIntegration(supabase: Awaited<ReturnType<typeof createClient>>, storeId: string) {
  const { data } = await supabase
    .from("store_integrations")
    .select("id, config")
    .eq("store_id", storeId)
    .eq("integration_id", "google-sheets")
    .single()
  return data
}

// GET — Fetch sheets and first-row headers from a specific spreadsheet
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
    const spreadsheetId = searchParams.get("spreadsheet_id")
    if (!storeId || !spreadsheetId)
      return NextResponse.json({ error: "Missing store_id or spreadsheet_id" }, { status: 400 })

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("owner_id", user.id)
      .single()

    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const integration = await getIntegration(supabase, storeId)
    if (!integration)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config = integration.config as any
    config = await refreshAccessToken(config)

    // Save refreshed token if needed
    if (config.access_token !== (integration.config as Record<string, unknown>).access_token) {
      await supabase
        .from("store_integrations")
        .update({ config, updated_at: new Date().toISOString() })
        .eq("id", integration.id)
    }

    const auth = getAuthenticatedClient(config)
    const sheetsClient = getSheetsClient(auth)

    let meta
    try {
      meta = await sheetsClient.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties(sheetId,title)",
      })
    } catch {
      return NextResponse.json(
        { error: "Cannot access spreadsheet. Make sure the URL is correct and the spreadsheet is shared with your Google account." },
        { status: 400 },
      )
    }

    const sheetTabs = (meta.data.sheets || []).map((s) => ({
      sheet_id: s.properties?.sheetId ?? 0,
      title: s.properties?.title || "Sheet1",
    }))

    const firstSheet = sheetTabs[0] || { sheet_id: 0, title: "Sheet1" }

    let headers: string[] = []
    try {
      const rangeRes = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range: `${firstSheet.title}!1:1`,
      })
      headers = rangeRes.data.values?.[0] || []
    } catch {
      // Sheet may be completely empty — return empty headers
    }

    return NextResponse.json({ headers, sheets: sheetTabs })
  } catch (err) {
    console.error("Google Sheets headers error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

// POST — Create a new spreadsheet
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { store_id, field_mappings, row_grouping } = await request.json()
    if (!store_id)
      return NextResponse.json({ error: "Missing store_id" }, { status: 400 })

    const { data: store } = await supabase
      .from("stores")
      .select("id, name")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const integration = await getIntegration(supabase, store_id)
    if (!integration)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config = integration.config as any
    config = await refreshAccessToken(config)

    // Merge field_mappings/row_grouping if provided
    if (field_mappings) config.field_mappings = field_mappings
    if (row_grouping) config.row_grouping = row_grouping

    const auth = getAuthenticatedClient(config)
    const sheets = getSheetsClient(auth)

    const sheetName = "Orders"
    const title = `${store.name} Orders`
    const headers = getHeaders(config.field_mappings)

    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          {
            properties: { title: sheetName },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: headers.map((h) => ({
                      userEnteredValue: { stringValue: h },
                      userEnteredFormat: { textFormat: { bold: true } },
                    })),
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const spreadsheetId = createRes.data.spreadsheetId!
    const spreadsheetName = createRes.data.properties?.title || title
    const createdSheetId = createRes.data.sheets?.[0]?.properties?.sheetId ?? 0

    const updatedConfig = {
      ...config,
      spreadsheet_id: spreadsheetId,
      spreadsheet_name: spreadsheetName,
      sheet_name: sheetName,
      sheet_id: createdSheetId,
    }

    await supabase
      .from("store_integrations")
      .update({
        config: updatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id)

    return NextResponse.json({
      spreadsheet_id: spreadsheetId,
      spreadsheet_name: spreadsheetName,
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    })
  } catch (err) {
    console.error("Google Sheets create error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

// PATCH — Link an existing spreadsheet
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { store_id, spreadsheet_id, field_mappings, row_grouping } = await request.json()
    if (!store_id || !spreadsheet_id)
      return NextResponse.json(
        { error: "Missing store_id or spreadsheet_id" },
        { status: 400 },
      )

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })

    const integration = await getIntegration(supabase, store_id)
    if (!integration)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config = integration.config as any
    config = await refreshAccessToken(config)

    // Merge field_mappings/row_grouping if provided
    if (field_mappings) config.field_mappings = field_mappings
    if (row_grouping) config.row_grouping = row_grouping

    const auth = getAuthenticatedClient(config)
    const sheets = getSheetsClient(auth)

    // Verify access to the spreadsheet
    let sheetData
    try {
      sheetData = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheet_id,
        fields: "properties.title,sheets.properties(sheetId,title)",
      })
    } catch {
      return NextResponse.json(
        { error: "Cannot access spreadsheet. Make sure the URL is correct." },
        { status: 400 },
      )
    }

    const spreadsheetName = sheetData.data.properties?.title || ""
    const firstSheet = sheetData.data.sheets?.[0]?.properties
    const firstSheetName = firstSheet?.title || "Sheet1"
    const firstSheetId = firstSheet?.sheetId ?? 0

    // Check if the first sheet is empty and add headers if needed
    try {
      const rangeRes = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheet_id,
        range: `${firstSheetName}!A1:M1`,
      })

      if (!rangeRes.data.values || rangeRes.data.values.length === 0) {
        const headers = getHeaders(config.field_mappings)
        await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheet_id,
          range: firstSheetName,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [headers] },
        })
      }
    } catch {
      // Ignore — headers check is best-effort
    }

    const updatedConfig = {
      ...config,
      spreadsheet_id,
      spreadsheet_name: spreadsheetName,
      sheet_name: firstSheetName,
      sheet_id: firstSheetId,
    }

    await supabase
      .from("store_integrations")
      .update({
        config: updatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id)

    return NextResponse.json({
      spreadsheet_id,
      spreadsheet_name: spreadsheetName,
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheet_id}`,
    })
  } catch (err) {
    console.error("Google Sheets link error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
