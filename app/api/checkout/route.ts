import { NextResponse } from "next/server"

// Polar checkout disabled for now
export async function GET() {
  return NextResponse.json({ error: "Billing not enabled yet" }, { status: 503 })
}
