import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
}

export async function POST(request: Request) {
  try {
    const { urls, storeId } = await request.json()

    if (!storeId || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "storeId and urls are required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const uploaded: { id: string; url: string }[] = []

    for (const imgUrl of urls.slice(0, 20)) {
      try {
        const imgRes = await fetch(imgUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "image/*",
          },
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
        })

        if (!imgRes.ok) continue

        const contentType = imgRes.headers.get("content-type")?.split(";")[0] || ""
        const ext = MIME_TO_EXT[contentType] || imgUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg"
        const arrayBuffer = await imgRes.arrayBuffer()
        if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 10 * 1024 * 1024) continue
        const buffer = Buffer.from(arrayBuffer)

        const storagePath = `${storeId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(storagePath, buffer, { contentType: contentType || "image/jpeg" })

        if (uploadError) continue

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(storagePath)

        const { data: inserted } = await supabase.from("store_images").insert({
          store_id: storeId,
          url: urlData.publicUrl,
          filename: imgUrl.split("/").pop()?.split("?")[0] || `image.${ext}`,
          storage_path: storagePath,
        }).select("id").single()

        if (inserted) {
          uploaded.push({ id: inserted.id, url: urlData.publicUrl })
        }
      } catch {
        // Skip failed images
      }
    }

    return NextResponse.json({ images: uploaded })
  } catch {
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 })
  }
}
