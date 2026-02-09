"use client"

import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface GalleryImage {
  id: string
  url: string
  filename: string
  storage_path: string
}

interface ImageGalleryDialogProps {
  storeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (images: { id: string; url: string }[]) => void
  multiple?: boolean
  maxSelect?: number
}

export function ImageGalleryDialog({
  storeId,
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  maxSelect = 1,
}: ImageGalleryDialogProps) {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState("gallery")
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setTab("gallery")
    loadImages()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadImages() {
    setLoading(true)
    const { data, error } = await supabase
      .from("store_images")
      .select("id, url, filename, storage_path")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      toast.error(t("imageGallery.failedList"))
      setLoading(false)
      return
    }

    setImages(data || [])
    setLoading(false)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (!multiple) {
        next.clear()
        next.add(id)
      } else if (next.size < maxSelect) {
        next.add(id)
      }
      return next
    })
  }

  function handleConfirm() {
    const result = images
      .filter((img) => selected.has(img.id))
      .map((img) => ({ id: img.id, url: img.url }))
    onSelect(result)
    onOpenChange(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const storagePath = `${storeId}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from("product-images")
        .upload(storagePath, file)

      if (error) {
        toast.error(t("imageUpload.failedUploadImage"))
        return
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(storagePath)

      const { data: inserted, error: dbError } = await supabase
        .from("store_images")
        .insert({
          store_id: storeId,
          url: urlData.publicUrl,
          filename: file.name,
          storage_path: storagePath,
        })
        .select("id, url, filename, storage_path")
        .single()

      if (dbError || !inserted) {
        toast.error(t("imageUpload.failedUploadImage"))
        return
      }

      setImages((prev) => [inserted, ...prev])

      if (!multiple) {
        setSelected(new Set([inserted.id]))
      } else if (selected.size < maxSelect) {
        setSelected((prev) => new Set([...prev, inserted.id]))
      }

      setTab("gallery")
    } catch {
      toast.error(t("imageUpload.failedUploadImage"))
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleDelete(image: GalleryImage) {
    await supabase.storage
      .from("product-images")
      .remove([image.storage_path])

    const { error: dbError } = await supabase
      .from("store_images")
      .delete()
      .eq("id", image.id)

    if (dbError) {
      toast.error(t("imageGallery.failedDelete"))
      return
    }

    setImages((prev) => prev.filter((img) => img.id !== image.id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(image.id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("imageGallery.title")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="gallery" className="flex-1">{t("imageGallery.tabGallery")}</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">{t("imageGallery.tabUpload")}</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("imageGallery.empty")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img) => {
                  const isSelected = selected.has(img.id)
                  return (
                    <div key={img.id} className="group relative aspect-square">
                      <button
                        type="button"
                        onClick={() => toggleSelect(img.id)}
                        className={`h-full w-full overflow-hidden rounded-md border-2 transition-colors ${
                          isSelected ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/10">
                            <div className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(img)}
                        className="absolute start-1 top-1 hidden rounded-full bg-destructive p-1 text-destructive-foreground group-hover:flex"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed py-12 text-muted-foreground hover:border-foreground hover:text-foreground">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <ImagePlus className="h-8 w-8" />
              )}
              <span className="mt-2 text-sm">
                {uploading ? t("imageUpload.uploading") : t("imageUpload.upload")}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("imageGallery.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            {t("imageGallery.select")}{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
