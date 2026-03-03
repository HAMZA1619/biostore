import { getExchangeRate } from "@/lib/market/exchange-rates"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 })
  }

  if (from === to) {
    return NextResponse.json({ rate: 1 })
  }

  const rate = await getExchangeRate(from, to)
  return NextResponse.json({ rate })
}
