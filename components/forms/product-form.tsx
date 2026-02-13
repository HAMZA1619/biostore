"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema } from "@/lib/validations/product"
import type { ProductOption, ProductVariant } from "@/lib/validations/product"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageUpload } from "@/components/dashboard/image-upload"
import type { ImageItem } from "@/components/dashboard/image-upload"
import { OptionValuesInput } from "@/components/forms/option-values-input"
import { getCurrencySymbol } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { revalidateStoreCache } from "@/lib/actions/revalidate"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Loader2, Plus, Trash2, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface ProductFormProps {
  storeId: string
  currency: string
  title: string
  initialData?: {
    id: string
    name: string
    sku: string | null
    description: string | null
    price: number
    compare_at_price: number | null
    stock: number | null
    images: ImageItem[]
    options: ProductOption[]
    status: "active" | "draft"
    is_available: boolean
  } | null
  initialVariants?: ProductVariant[]
}

function generateVariants(
  options: ProductOption[],
  existing: ProductVariant[],
  basePrice: number,
  stockEnabled: boolean
): ProductVariant[] {
  const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0)
  if (validOptions.length === 0) return []

  const combos = validOptions.reduce<Record<string, string>[]>(
    (acc, option) =>
      acc.flatMap((combo) =>
        option.values.map((value) => ({ ...combo, [option.name]: value }))
      ),
    [{}]
  )

  return combos.map((optionCombo) => {
    const match = existing.find(
      (v) => JSON.stringify(v.options) === JSON.stringify(optionCombo)
    )
    return (
      match || {
        options: optionCombo,
        price: basePrice,
        compare_at_price: null,
        sku: "",
        stock: stockEnabled ? 1000 : null,
        is_available: true,
      }
    )
  })
}

function variantLabel(options: Record<string, string>): string {
  return Object.values(options).join(" / ")
}

export function ProductForm({ storeId, currency, title, initialData, initialVariants = [] }: ProductFormProps) {
  const symbol = getCurrencySymbol(currency)
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [images, setImages] = useState<ImageItem[]>(initialData?.images || [])
  const [imagesChanged, setImagesChanged] = useState(false)
  const [options, setOptions] = useState<ProductOption[]>(initialData?.options || [])
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants)
  const [optionsChanged, setOptionsChanged] = useState(false)
  const [trackStock, setTrackStock] = useState(initialData?.stock != null || initialVariants.some((v) => v.stock != null))
  const router = useRouter()
  const supabase = createClient()

  const [fetchUrl, setFetchUrl] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [pendingImageUrls, setPendingImageUrls] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      compare_at_price: initialData?.compare_at_price || undefined,
      stock: initialData?.stock ?? undefined,
      status: initialData?.status || "active",
      is_available: initialData?.is_available ?? true,
    },
  })

  const regenerateVariants = useCallback(
    (newOptions: ProductOption[]) => {
      const basePrice = getValues("price") || 0
      setVariants((prev) => generateVariants(newOptions, prev, basePrice, trackStock))
    },
    [getValues, trackStock]
  )

  function updateOption(index: number, field: "name" | "values", value: string | string[]) {
    const updated = options.map((o, i) =>
      i === index ? { ...o, [field]: value } : o
    )
    setOptions(updated)
    setOptionsChanged(true)
    regenerateVariants(updated)
  }

  function addOption() {
    if (options.length >= 3) return
    setOptions([...options, { name: "", values: [] }])
    setOptionsChanged(true)
  }

  function removeOption(index: number) {
    const updated = options.filter((_, i) => i !== index)
    setOptions(updated)
    setOptionsChanged(true)
    regenerateVariants(updated)
  }

  function updateVariantField(index: number, field: keyof ProductVariant, value: unknown) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
    setOptionsChanged(true)
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
    setOptionsChanged(true)
  }

  function setAllPrices() {
    const basePrice = getValues("price") || 0
    setVariants((prev) => prev.map((v) => ({ ...v, price: basePrice })))
    setOptionsChanged(true)
  }

  async function fetchUrlDetails() {
    if (!fetchUrl) {
      toast.error(t("productForm.enterUrlFirst"))
      return
    }

    setFetching(true)
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fetchUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || t("productForm.failedFetchUrl"))
        setFetching(false)
        return
      }
      // Populate form fields
      if (data.title) setValue("name", data.title, { shouldDirty: true })
      if (data.description) setValue("description", data.description.slice(0, 1000), { shouldDirty: true })
      if (data.price != null) setValue("price", data.price, { shouldDirty: true })
      if (data.sku) setValue("sku", data.sku, { shouldDirty: true })

      // Set pending image URLs (will be uploaded on save)
      const scrapedImageUrls = (data.images as string[] || [])
      if (scrapedImageUrls.length > 0) {
        setPendingImageUrls(scrapedImageUrls)
        setImagesChanged(true)
      }

      // Set options and variants
      const scrapedOptions = (data.options as { name: string; values: string[] }[] || []).slice(0, 3)
      const validOptions = scrapedOptions.filter((o) => o.name.trim() && o.values.length > 0)

      if (validOptions.length > 0) {
        setOptions(validOptions)
        setOptionsChanged(true)

        if (data.variants?.length) {
          const scrapedVariants = (data.variants as { options: Record<string, string>; price: number; sku: string; is_available: boolean }[]).map((v) => ({
            options: v.options,
            price: v.price || data.price || 0,
            compare_at_price: null,
            sku: v.sku || "",
            stock: null,
            is_available: v.is_available ?? true,
          }))
          setVariants(scrapedVariants)
        } else {
          regenerateVariants(validOptions)
        }
      }

      setImportOpen(false)
      toast.success(t("productForm.importSuccess"))
    } catch {
      toast.error(t("productForm.failedFetchUrl"))
    } finally {
      setFetching(false)
    }
  }

  async function onSubmit(data: z.infer<typeof productSchema>) {
    setLoading(true)

    // Upload pending external images first
    let allImages = [...images]
    if (pendingImageUrls.length > 0) {
      try {
        const uploadRes = await fetch("/api/upload-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: pendingImageUrls, storeId }),
        })
        if (!uploadRes.ok) {
          toast.error(t("productForm.imageUploadFailed"))
          setLoading(false)
          return
        }
        
        const uploadData = await uploadRes.json()
        const uploadedImages = (uploadData.images || []) as ImageItem[]
        allImages = [...allImages, ...uploadedImages]
        setImages(allImages)
        setPendingImageUrls([])
      } catch {
        toast.error(t("productForm.imageUploadFailed"))
        setLoading(false)
        return
      }
    }

    const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0)

    const payload = {
      ...data,
      store_id: storeId,
      image_urls: allImages.map((i) => i.id),
      sku: data.sku || null,
      compare_at_price: data.compare_at_price || null,
      stock: data.stock ?? null,
      options: validOptions,
    }

    let productId = initialData?.id

    if (initialData) {
      const { error } = await supabase
        .from("products")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", initialData.id)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
    } else {
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single()

      if (error || !newProduct) {
        toast.error(error?.message || t("productForm.failedCreateProduct"))
        setLoading(false)
        return
      }
      productId = newProduct.id
    }

    // Sync variants
    if (productId) {
      const { error: deleteError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId)

      if (deleteError) {
        toast.error(t("productForm.variantsFailed", { message: deleteError.message }))
        setLoading(false)
        return
      }

      if (validOptions.length > 0 && variants.length > 0) {
        const variantRows = variants.map((v, i) => ({
          product_id: productId,
          options: v.options,
          price: v.price,
          compare_at_price: v.compare_at_price || null,
          sku: v.sku || null,
          stock: v.stock ?? null,
          is_available: v.is_available,
          sort_order: i,
        }))

        const { error: varError } = await supabase
          .from("product_variants")
          .insert(variantRows)

        if (varError) {
          toast.error(t("productForm.variantsFailed", { message: varError.message }))
          setLoading(false)
          return
        }
      }
    }

    toast.success(initialData ? t("productForm.productUpdated") : t("productForm.productAdded"))
    const tags = [`products:${storeId}`]
    if (initialData) tags.push(`product:${initialData.id}`)
    await revalidateStoreCache(tags)
    setLoading(false)
    router.push("/dashboard/products")
  }

  const hasChanges = isDirty || imagesChanged || optionsChanged || pendingImageUrls.length > 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t(title)}</h1>
          <Select
            value={watch("status")}
            onValueChange={(v) => { setValue("status", v as "active" | "draft", { shouldDirty: true }) }}
          >
            <SelectTrigger className="h-8 w-[130px] border-transparent bg-transparent px-2 hover:bg-muted/50">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${watch("status") === "active" ? "bg-green-500" : "bg-red-400"}`} />
                  <span className="text-sm">{watch("status") === "active" ? t("products.statusActive") : t("products.statusDraft")}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t("products.statusActive")}
                </span>
              </SelectItem>
              <SelectItem value="draft">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  {t("products.statusDraft")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          {!initialData && (
            <Dialog open={importOpen} onOpenChange={(open) => { if (!fetching) setImportOpen(open) }}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost">
                  <Globe className="me-2 h-4 w-4" />
                  {t("productForm.import")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("productForm.importFromUrl")}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {t("productForm.importDescription")}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    placeholder={t("productForm.urlPlaceholder")}
                    type="url"
                    className="flex-1"
                    disabled={fetching}
                  />
                  <Button
                    type="button"
                    onClick={fetchUrlDetails}
                    disabled={fetching}
                  >
                    {fetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span className="ms-2">{fetching ? t("productForm.saving") : t("productForm.fetch")}</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("productForm.cancel")}
          </Button>
          <Button type="submit" disabled={loading || (!!initialData && !hasChanges)}>
            {loading ? t("productForm.saving") : initialData ? t("productForm.updateProduct") : t("productForm.addProductBtn")}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("productForm.productName")}</Label>
          <Input id="name" {...register("name")} placeholder={t("productForm.productName")} />
          {errors.name && <p className="text-sm text-red-600">{t(errors.name.message!)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("productForm.description")}</Label>
          <Textarea id="description" {...register("description")} placeholder={t("productForm.describePlaceholder")} rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">{t("productForm.sku")}</Label>
          <Input id="sku" {...register("sku")} placeholder={t("productForm.skuPlaceholder")} />
        </div>

        <div className="space-y-2">
          <Label>{t("productForm.images")}</Label>
          <ImageUpload storeId={storeId} images={images} onImagesChange={(imgs) => { setImages(imgs); setImagesChanged(true) }} />
          {pendingImageUrls.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("productForm.pendingImages")}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {pendingImageUrls.map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-dashed">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPendingImageUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">{t("productForm.price")}</Label>
            <div className="relative">
              <Input id="price" type="number" step="0.01" className="pe-12" {...register("price", { valueAsNumber: true })} />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
            </div>
            {errors.price && <p className="text-sm text-red-600">{t(errors.price.message!)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compare_at_price">{t("productForm.compareAtPrice")}</Label>
            <div className="relative">
              <Input
                id="compare_at_price"
                type="number"
                step="0.01"
                className="pe-12"
                {...register("compare_at_price", {
                  setValueAs: (v: string) => {
                    if (v === "" || v === undefined) return undefined
                    const n = parseFloat(v)
                    return isNaN(n) ? undefined : n
                  },
                })}
                placeholder={t("productForm.optional")}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={trackStock}
              onCheckedChange={(checked) => {
                setTrackStock(checked)
                if (checked) {
                  setValue("stock", 1000, { shouldDirty: true })
                  setVariants((prev) => prev.map((v) => v.stock == null ? { ...v, stock: 1000 } : v))
                } else {
                  setValue("stock", undefined, { shouldDirty: true })
                  setVariants((prev) => prev.map((v) => ({ ...v, stock: null })))
                }
                setOptionsChanged(true)
              }}
            />
            <Label>{t("productForm.trackStock")}</Label>
          </div>
          {trackStock && (
            <div className="space-y-2">
              <Label htmlFor="stock">{t("productForm.stockQuantity")}</Label>
              <Input
                id="stock"
                type="number"
                step="1"
                min="0"
                max="1000"
                {...register("stock", {
                  setValueAs: (v: string) => {
                    if (v === "" || v === undefined) return undefined
                    const n = parseInt(v, 10)
                    if (isNaN(n)) return undefined
                    return Math.min(n, 1000)
                  },
                })}
              />
            </div>
          )}
        </div>

        {/* Product Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("productForm.productOptions")}</Label>
            <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={addOption}>
              {t("productForm.addNewOption")}
            </button>
          </div>

          {options.map((option, i) => (
            <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full space-y-1 sm:w-36 sm:shrink-0">
                <Label className="text-xs text-muted-foreground">{t("productForm.optionName")}</Label>
                <Input
                  value={option.name}
                  onChange={(e) => updateOption(i, "name", e.target.value)}
                  placeholder={t("productForm.optionNamePlaceholder")}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">{t("productForm.optionValues")}</Label>
                <OptionValuesInput
                  values={option.values}
                  onChange={(values) => updateOption(i, "values", values)}
                  placeholder={t("productForm.optionValuesPlaceholder")}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5 shrink-0 self-end"
                onClick={() => removeOption(i)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          {options.length > 0 && <hr />}
        </div>

        {/* Variants Table */}
        {variants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("productForm.variants", { count: variants.length })}</Label>
              <Button type="button" variant="outline" size="sm" onClick={setAllPrices}>
                {t("productForm.setAllPrices")}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-start font-medium">{t("productForm.variantColumns.variant")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("productForm.variantColumns.price")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("productForm.variantColumns.compareAt")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("productForm.variantColumns.sku")}</th>
                    {trackStock && <th className="px-3 py-2 text-start font-medium">{t("productForm.variantColumns.stock")}</th>}
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">
                        {variantLabel(variant.options)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative w-fit">
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) =>
                              updateVariantField(i, "price", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 w-28 pe-10"
                          />
                          <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative w-fit">
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.compare_at_price ?? ""}
                            onChange={(e) => {
                              const v = e.target.value
                              updateVariantField(i, "compare_at_price", v === "" ? null : parseFloat(v) || null)
                            }}
                            placeholder="—"
                            className="h-8 w-28 pe-10"
                          />
                          <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={variant.sku || ""}
                          onChange={(e) => updateVariantField(i, "sku", e.target.value)}
                          placeholder={t("productForm.optional")}
                          className="h-8 w-28"
                        />
                      </td>
                      {trackStock && (
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="1000"
                            value={variant.stock ?? ""}
                            onChange={(e) => {
                              const v = e.target.value
                              const n = v === "" ? null : Math.min(parseInt(v, 10) || 0, 1000)
                              updateVariantField(i, "stock", n)
                            }}
                            className="h-8 w-20"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeVariant(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </form>
  )
}
