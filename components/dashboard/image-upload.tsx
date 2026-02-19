"use client"

import { ImageGalleryDialog } from "@/components/dashboard/image-gallery-dialog"
import { getImageUrl } from "@/lib/utils"
import { Images, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export interface ImageItem {
  id: string
  storage_path: string
}

interface ImageUploadProps {
  storeId: string
  images: ImageItem[]
  onImagesChange: (images: ImageItem[]) => void
}

export function ImageUpload({
  storeId,
  images,
  onImagesChange,
}: ImageUploadProps) {
  const { t } = useTranslation()
  const [galleryOpen, setGalleryOpen] = useState(false)

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-md border">
            <Image src={getImageUrl(img.storage_path)!} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute end-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <Images className="h-5 w-5" />
          <span className="text-xs">{t("imageGallery.browse")}</span>
        </button>
      </div>
      <ImageGalleryDialog
        storeId={storeId}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={(selected) => onImagesChange([...images, ...selected])}
        multiple
      />
    </div>
  )
}
