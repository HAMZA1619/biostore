import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { store_id } = body

    if (!store_id) {
      return NextResponse.json(
        { error: "Missing store_id" },
        { status: 400 }
      )
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "")
    const evolutionKey = process.env.EVOLUTION_API_KEY
    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json(
        { error: "Evolution API not configured" },
        { status: 500 }
      )
    }

    const instanceName = `store-${store_id}`
    const headers = { "Content-Type": "application/json", apikey: evolutionKey }

    // Step 1: Delete any existing stale instance
    await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: evolutionKey },
      signal: AbortSignal.timeout(5000),
    }).catch(() => {})

    await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: evolutionKey },
      signal: AbortSignal.timeout(5000),
    }).catch(() => {})

    // Step 2: Create fresh instance
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
      signal: AbortSignal.timeout(15000),
    })

    const rawBody = await createRes.text()
    console.log("Evolution create response:", rawBody.substring(0, 500))

    let createData: Record<string, unknown> = {}
    try {
      createData = JSON.parse(rawBody)
    } catch {}

    if (!createRes.ok) {
      console.error("Evolution API create error:", createRes.status)
      let message = `Evolution API error ${createRes.status}`
      if (createData.message) message = String(createData.message)
      return NextResponse.json({ error: message }, { status: createRes.status })
    }

    // Step 3: Save integration
    await supabase
      .from("store_integrations")
      .upsert(
        {
          store_id,
          integration_id: "whatsapp",
          config: {
            instance_name: instanceName,
            connected: false,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id,integration_id" }
      )

    // Step 4: Extract QR from create response
    let qrBase64 = extractQrBase64(createData)

    // Step 5: If no QR from create, try connect endpoint
    if (!qrBase64) {
      const connectRes = await fetch(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {
          headers: { apikey: evolutionKey },
          signal: AbortSignal.timeout(15000),
        }
      )

      if (connectRes.ok) {
        const connectRaw = await connectRes.text()
        console.log("Evolution connect response:", connectRaw.substring(0, 500))
        try {
          const connectData = JSON.parse(connectRaw)
          qrBase64 = extractQrBase64(connectData)
        } catch {}
      }
    }

    return NextResponse.json({
      instance_name: instanceName,
      qrcode: qrBase64 ? { base64: qrBase64 } : null,
    })
  } catch (err) {
    console.error("WhatsApp connect error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

function extractQrBase64(data: Record<string, unknown>): string | null {
  const qr = data.qrcode as Record<string, unknown> | string | undefined
  const base64 = data.base64 as string | undefined

  if (base64 && typeof base64 === "string") {
    return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`
  }

  if (typeof qr === "string") {
    return qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`
  }

  if (qr && typeof qr === "object") {
    const b64 = (qr as Record<string, unknown>).base64 as string | undefined
    if (b64) {
      return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`
    }
    const code = (qr as Record<string, unknown>).code as string | undefined
    if (code) return code
    const pairingCode = (qr as Record<string, unknown>).pairingCode as string | undefined
    if (pairingCode) return pairingCode
  }

  return null
}
