"use client"

import { ImageGalleryDialog } from "@/components/dashboard/image-gallery-dialog"
import { getImageUrl } from "@/lib/utils"
import { Images, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface SingleImageUploadProps {
  storeId: string
  value: string | null
  onChange: (storagePath: string | null) => void
  aspect?: "square" | "wide"
  label?: string
}

export function SingleImageUpload({
  storeId,
  value,
  onChange,
  label,
}: SingleImageUploadProps) {
  const { t } = useTranslation()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const displayUrl = getImageUrl(value)

  if (value && displayUrl) {
    return (
      <div className="h-full space-y-1">
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <div className="relative h-full w-full overflow-hidden rounded-md border">
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute end-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full space-y-1">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <button
        type="button"
        onClick={() => setGalleryOpen(true)}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        <Images className="h-5 w-5" />
        <span className="mt-1 text-xs">{t("imageGallery.browse")}</span>
      </button>
      <ImageGalleryDialog
        storeId={storeId}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={(imgs) => { if (imgs.length > 0) onChange(imgs[0].storage_path) }}
      />
    </div>
  )
}
