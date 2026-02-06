"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [current, setCurrent] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square overflow-hidden bg-muted" style={{ borderRadius: "var(--store-radius)" }}>
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40">
          <ImageIcon className="h-16 w-16" />
        </div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="aspect-square overflow-hidden bg-muted" style={{ borderRadius: "var(--store-radius)" }}>
        <img src={images[0]} alt={productName} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Main image with arrows */}
      <div className="relative aspect-square overflow-hidden bg-muted" style={{ borderRadius: "var(--store-radius)" }}>
        <img
          src={images[current]}
          alt={productName}
          className="h-full w-full object-cover"
        />

        <button
          type="button"
          onClick={() => setCurrent((prev) => (prev - 1 + images.length) % images.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrent((prev) => (prev + 1) % images.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={cn(
              "h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted transition",
              i === current ? "ring-2 ring-[var(--store-accent)]" : "opacity-60 hover:opacity-100"
            )}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
