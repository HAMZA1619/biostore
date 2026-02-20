"use client"

import imageCompression from "browser-image-compression"
import { createClient } from "@/lib/supabase/client"
import { getImageUrl } from "@/lib/utils"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Check, ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const PAGE_SIZE = 30

interface GalleryImage {
  id: string
  filename: string
  storage_path: string
}

interface ImageGalleryDialogProps {
  storeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (images: { id: string; storage_path: string }[]) => void
  multiple?: boolean
}

export function ImageGalleryDialog({
  storeId,
  open,
  onOpenChange,
  onSelect,
  multiple = false,
}: ImageGalleryDialogProps) {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 })
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setImages([])
    setHasMore(true)
    loadImages(0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadImages(offset: number) {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)

    const { data, error } = await supabase
      .from("store_images")
      .select("id, filename, storage_path")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      toast.error(t("imageGallery.failedList"))
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const fetched = data || []
    setImages((prev) => offset === 0 ? fetched : [...prev, ...fetched])
    setHasMore(fetched.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    loadImages(images.length)
  }, [loadingMore, hasMore, images.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !open) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: "100px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, loadMore])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (!multiple) {
        next.clear()
        next.add(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleConfirm() {
    const result = images
      .filter((img) => selected.has(img.id))
      .map((img) => ({ id: img.id, storage_path: img.storage_path }))
    onSelect(result)
    onOpenChange(false)
  }

  async function handleDeleteSelected() {
    const toDelete = images.filter((img) => selected.has(img.id))
    if (toDelete.length === 0) return

    setDeleting(true)
    const storagePaths = toDelete.map((img) => img.storage_path)
    const ids = toDelete.map((img) => img.id)

    await supabase.storage.from("product-images").remove(storagePaths)

    const { error: dbError } = await supabase
      .from("store_images")
      .delete()
      .in("id", ids)

    if (dbError) {
      toast.error(t("imageGallery.failedDelete"))
      setDeleting(false)
      return
    }

    setImages((prev) => prev.filter((img) => !selected.has(img.id)))
    setSelected(new Set())
    setDeleting(false)
    setConfirmDeleteOpen(false)
  }

  async function compressFile(file: File): Promise<File> {
    if (file.type === "image/svg+xml" || file.type === "image/gif") return file

    return imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      fileType: "image/webp",
      useWebWorker: true,
    })
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return
    setUploading(true)
    setUploadCount({ done: 0, total: files.length })

    const uploaded: GalleryImage[] = []

    await Promise.all(
      files.map(async (file) => {
        try {
          const compressed = await compressFile(file)
          const isSvg = file.type === "image/svg+xml"
          const isGif = file.type === "image/gif"
          const ext = isSvg ? "svg" : isGif ? "gif" : "webp"
          const storagePath = `${storeId}/${crypto.randomUUID()}.${ext}`

          const { error } = await supabase.storage
            .from("product-images")
            .upload(storagePath, compressed)

          if (error) return

          const { data: inserted } = await supabase
            .from("store_images")
            .insert({
              store_id: storeId,
              filename: file.name,
              storage_path: storagePath,
            })
            .select("id, filename, storage_path")
            .single()

          if (inserted) uploaded.push(inserted)
        } catch {
          // skip failed
        } finally {
          setUploadCount((prev) => ({ ...prev, done: prev.done + 1 }))
        }
      })
    )

    if (uploaded.length > 0) {
      setImages((prev) => [...uploaded.reverse(), ...prev])
      const newIds = uploaded.map((img) => img.id)
      if (!multiple) {
        setSelected(new Set([newIds[0]]))
      } else {
        setSelected((prev) => new Set([...prev, ...newIds]))
      }
    }

    if (uploaded.length < files.length) {
      toast.error(t("imageUpload.failedUploadImage"))
    }

    setUploading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    uploadFiles(files)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          <DialogHeader className="pe-8">
            <div className="flex items-center justify-between">
              <DialogTitle>{t("imageGallery.title")}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading
                  ? `${uploadCount.done}/${uploadCount.total}`
                  : t("imageUpload.upload")}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </DialogHeader>

          <div
            className={`min-h-0 flex-1 overflow-y-auto rounded-md transition-colors ${
              dragOver ? "border border-primary bg-primary/5" : ""
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center py-16 text-muted-foreground hover:text-foreground"
              >
                <ImagePlus className="mb-2 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm">{t("imageGallery.empty")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("imageUpload.dragOrClick")}</p>
              </button>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1.5 p-1 sm:grid-cols-4 md:grid-cols-5">
                  {images.map((img) => {
                    const isSelected = selected.has(img.id)
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => toggleSelect(img.id)}
                        className={`group relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                          isSelected
                            ? "border-primary ring-1 ring-primary"
                            : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <img
                          src={getImageUrl(img.storage_path)!}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/10">
                            <div className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div ref={sentinelRef} className="flex justify-center py-3">
                  {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {selected.size > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="me-auto"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t("imageGallery.delete")} ({selected.size})
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("imageGallery.cancel")}
            </Button>
            <Button onClick={handleConfirm} disabled={selected.size === 0}>
              {t("imageGallery.select")}{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("imageGallery.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("imageGallery.confirmDeleteDescription", { count: selected.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("imageGallery.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Trash2 className="me-2 h-4 w-4" />}
              {t("imageGallery.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
