"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

interface ImageUploadProps {
  storeId: string
  images: string[]
  onImagesChange: (images: string[]) => void
  max?: number
}

export function ImageUpload({
  storeId,
  images,
  onImagesChange,
  max = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > max) {
      toast.error(`Maximum ${max} images`)
      return
    }

    setUploading(true)
    const newImages: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()
      const path = `${storeId}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file)

      if (error) {
        toast.error(`Failed to upload ${file.name}`)
        continue
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path)

      newImages.push(data.publicUrl)
    }

    onImagesChange([...images, ...newImages])
    setUploading(false)
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative h-24 w-24 overflow-hidden rounded-md border">
            <Image src={url} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground">
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">Upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
    </div>
  )
}
