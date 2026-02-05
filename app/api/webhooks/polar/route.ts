import { NextResponse } from "next/server"

// Polar webhooks disabled for now
export async function POST() {
  return NextResponse.json({ error: "Webhooks not enabled yet" }, { status: 503 })
}
