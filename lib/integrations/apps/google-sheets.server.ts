import urlJoin from "url-join"
import { createAdminClient } from "@/lib/supabase/admin"
import { google } from "googleapis"
import {
  formatOrderRows,
  getHeaders,
  type FieldMapping,
  type RowGrouping,
  type EventPayload,
} from "@/lib/integrations/apps/google-sheets"

interface GoogleSheetsConfig {
  access_token: string
  refresh_token: string
  token_expiry: number
  spreadsheet_id: string
  spreadsheet_name: string
  sheet_name: string
  sheet_id?: number
  connected: boolean
  field_mappings?: FieldMapping[]
  row_grouping?: RowGrouping
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    urlJoin(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", "api/integrations/google-sheets/callback"),
  )
}

export function getAuthenticatedClient(config: { access_token: string; refresh_token: string }) {
  const oauth2 = createOAuth2Client()
  oauth2.setCredentials({
    access_token: config.access_token,
    refresh_token: config.refresh_token,
  })
  return oauth2
}

export function getSheetsClient(auth: ReturnType<typeof getAuthenticatedClient>) {
  return google.sheets({ version: "v4", auth })
}

export async function refreshAccessToken(
  config: GoogleSheetsConfig,
): Promise<GoogleSheetsConfig> {
  if (Date.now() < config.token_expiry - 60_000) {
    return config
  }

  const oauth2 = createOAuth2Client()
  oauth2.setCredentials({ refresh_token: config.refresh_token })
  const { credentials } = await oauth2.refreshAccessToken()

  return {
    ...config,
    access_token: credentials.access_token!,
    token_expiry: credentials.expiry_date || Date.now() + 3600 * 1000,
  }
}

export async function handleGoogleSheets(
  eventType: string,
  payload: EventPayload,
  config: GoogleSheetsConfig,
  storeId: string,
  storeName: string,
  currency: string,
): Promise<void> {
  if (eventType !== "order.created" && eventType !== "checkout.abandoned") return
  if (eventType === "checkout.abandoned" && !(config as Record<string, unknown>).track_abandoned_checkouts) return
  if (!config.connected || !config.spreadsheet_id || !config.refresh_token) return

  const refreshed = await refreshAccessToken(config)

  if (refreshed.access_token !== config.access_token) {
    const supabase = createAdminClient()
    await supabase
      .from("store_integrations")
      .update({
        config: refreshed,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeId)
      .eq("integration_id", "google-sheets")
  }

  const auth = getAuthenticatedClient(refreshed)
  const sheets = getSheetsClient(auth)
  const rows = formatOrderRows(payload, currency, refreshed.field_mappings, refreshed.row_grouping)

  await sheets.spreadsheets.values.append({
    spreadsheetId: refreshed.spreadsheet_id,
    range: refreshed.sheet_name || "Orders",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  })
}

export { getHeaders, formatOrderRows }
