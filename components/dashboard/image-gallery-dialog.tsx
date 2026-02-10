"use client"

import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

const PAGE_SIZE = 30

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
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [tab, setTab] = useState("gallery")
  const supabase = createClient()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setTab("gallery")
    setImages([])
    setHasMore(true)
    loadImages(0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadImages(offset: number) {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)

    const { data, error } = await supabase
      .from("store_images")
      .select("id, url, filename, storage_path")
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
      .map((img) => ({ id: img.id, url: img.url }))
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
      } else {
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

  return (
    <>
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
                <>
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
                        </div>
                      )
                    })}
                  </div>
                  <div ref={sentinelRef} className="flex justify-center py-3">
                    {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                </>
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

          <DialogFooter className="gap-2 sm:gap-0">
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
