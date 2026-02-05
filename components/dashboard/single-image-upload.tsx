"use client"

import { createClient } from "@/lib/supabase/client"
import { ImagePlus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface SingleImageUploadProps {
  storeId: string
  value: string | null
  onChange: (url: string | null) => void
  aspect?: "square" | "wide"
  label?: string
}

export function SingleImageUpload({
  storeId,
  value,
  onChange,
  aspect = "square",
  label,
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `${storeId}/store-assets/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file)

    if (error) {
      toast.error("Failed to upload image")
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(path)

    onChange(data.publicUrl)
    setUploading(false)
  }

  if (value) {
    return (
      <div className="space-y-1">
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <div
          className={`relative overflow-hidden rounded-md border ${
            aspect === "wide" ? "h-28 w-full" : "h-24 w-24"
          }`}
        >
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground ${
          aspect === "wide" ? "h-28 w-full" : "h-24 w-24"
        }`}
      >
        <ImagePlus className="h-5 w-5" />
        <span className="mt-1 text-xs">{uploading ? "Uploading..." : "Upload"}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  )
}
