import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 120

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

    const supabase = await createClient()

    const results = await Promise.all(
      urls.map(async (imgUrl: string) => {
        try {
          const imgRes = await fetch(imgUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "image/*",
            },
            signal: AbortSignal.timeout(60000),
            redirect: "follow",
          })
          if (!imgRes.ok) return null

          const contentType = imgRes.headers.get("content-type")?.split(";")[0] || ""
          const ext = MIME_TO_EXT[contentType] || imgUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg"
          const arrayBuffer = await imgRes.arrayBuffer()
          if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 10 * 1024 * 1024) return null
          const buffer = Buffer.from(arrayBuffer)

          const storagePath = `${storeId}/${crypto.randomUUID()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(storagePath, buffer, { contentType: contentType || "image/jpeg" })
          if (uploadError) return null

          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(storagePath)

          const { data: inserted } = await supabase.from("store_images").insert({
            store_id: storeId,
            url: urlData.publicUrl,
            filename: imgUrl.split("/").pop()?.split("?")[0] || `image.${ext}`,
            storage_path: storagePath,
          }).select("id").single()

          if (inserted) return { id: inserted.id, url: urlData.publicUrl }
          return null
        } catch {
          return null
        }
      })
    )

    const uploaded = results.filter(Boolean) as { id: string; url: string }[]
    return NextResponse.json({ images: uploaded })
  } catch {
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 })
  }
}
