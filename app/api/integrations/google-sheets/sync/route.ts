export const maxDuration = 120

import { createClient } from "@/lib/supabase/server"
import {
  refreshAccessToken,
  formatOrderRows,
  getHeaders,
  getAuthenticatedClient,
  getSheetsClient,
} from "@/lib/integrations/apps/google-sheets.server"
import { NextResponse } from "next/server"

const PAGE_SIZE = 200
const SHEET_BATCH_SIZE = 500

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
      .select("id, currency")
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config = integration.config as any
    if (!config.connected || !config.spreadsheet_id)
      return NextResponse.json(
        { error: "Spreadsheet not configured" },
        { status: 400 },
      )

    config = await refreshAccessToken(config)

    const auth = getAuthenticatedClient(config)
    const sheets = getSheetsClient(auth)
    const sheetName = config.sheet_name || "Orders"
    const mappings = config.field_mappings
    const grouping = config.row_grouping

    // Clear the sheet and write headers
    await sheets.spreadsheets.values.clear({
      spreadsheetId: config.spreadsheet_id,
      range: sheetName,
      requestBody: {},
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheet_id,
      range: sheetName,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [getHeaders(mappings)] },
    })

    // Paginate orders and append in batches
    let synced = 0
    let offset = 0
    let rowBuffer: string[][] = []

    while (true) {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          "order_number, customer_name, customer_phone, customer_email, customer_city, customer_country, customer_address, status, total, subtotal, note, created_at, order_items(product_name, product_price, quantity, variant_options)",
        )
        .eq("store_id", store_id)
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (ordersError)
        return NextResponse.json(
          { error: "Failed to fetch orders" },
          { status: 500 },
        )

      if (!orders || orders.length === 0) break

      for (const order of orders) {
        const rows = formatOrderRows(
          { ...order, items: order.order_items || [] },
          store.currency,
          mappings,
          grouping,
        )
        rowBuffer.push(...rows)

        if (rowBuffer.length >= SHEET_BATCH_SIZE) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: config.spreadsheet_id,
            range: sheetName,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: rowBuffer },
          })
          rowBuffer = []
        }
      }

      synced += orders.length
      if (orders.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    // Flush remaining rows
    if (rowBuffer.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheet_id,
        range: sheetName,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rowBuffer },
      })
    }

    // Update config with refreshed token if needed
    if (config.access_token !== (integration.config as Record<string, unknown>).access_token) {
      await supabase
        .from("store_integrations")
        .update({
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id)
    }

    return NextResponse.json({ synced })
  } catch (err) {
    console.error("Google Sheets sync error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
