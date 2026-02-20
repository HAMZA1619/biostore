import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import sharp from "sharp"

export const maxDuration = 120

const SKIP_COMPRESSION = new Set(["image/svg+xml", "image/gif"])

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
          const arrayBuffer = await imgRes.arrayBuffer()
          if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 10 * 1024 * 1024) return null
          const rawBuffer = Buffer.from(arrayBuffer)

          const skip = SKIP_COMPRESSION.has(contentType)
          let uploadBuffer: Buffer
          let ext: string
          let uploadContentType: string

          if (skip) {
            uploadBuffer = rawBuffer
            ext = contentType === "image/gif" ? "gif" : "svg"
            uploadContentType = contentType
          } else {
            uploadBuffer = await sharp(rawBuffer)
              .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 80 })
              .toBuffer()
            ext = "webp"
            uploadContentType = "image/webp"
          }

          const storagePath = `${storeId}/${crypto.randomUUID()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(storagePath, uploadBuffer, { contentType: uploadContentType })
          if (uploadError) return null

          const { data: inserted } = await supabase.from("store_images").insert({
            store_id: storeId,
            filename: imgUrl.split("/").pop()?.split("?")[0] || `image.${ext}`,
            storage_path: storagePath,
          }).select("id, storage_path").single()

          if (inserted) return { id: inserted.id, storage_path: inserted.storage_path }
          return null
        } catch {
          return null
        }
      })
    )

    const uploaded = results.filter(Boolean) as { id: string; storage_path: string }[]
    return NextResponse.json({ images: uploaded })
  } catch {
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 })
  }
}
