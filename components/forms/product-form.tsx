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
import { OptionValuesInput } from "@/components/forms/option-values-input"
import { getCurrencySymbol } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Loader2, Plus, Trash2, Wand2 } from "lucide-react"

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
    image_urls: string[]
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
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [images, setImages] = useState<string[]>(initialData?.image_urls || [])
  const [imagesChanged, setImagesChanged] = useState(false)
  const [options, setOptions] = useState<ProductOption[]>(initialData?.options || [])
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants)
  const [optionsChanged, setOptionsChanged] = useState(false)
  const [trackStock, setTrackStock] = useState(initialData?.stock != null || initialVariants.some((v) => v.stock != null))
  const router = useRouter()
  const supabase = createClient()

  const [fetchUrl, setFetchUrl] = useState("")
  const [importOpen, setImportOpen] = useState(false)

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
      toast.error("Enter a URL first")
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
        toast.error(data.error || "Failed to fetch URL")
        setFetching(false)
        return
      }

      if (data.title) setValue("name", data.title, { shouldDirty: true })
      if (data.description) setValue("description", data.description, { shouldDirty: true })
      if (data.price) setValue("price", data.price, { shouldDirty: true })
      if (data.images?.length) {
        setImages((prev) => {
          const existing = new Set(prev)
          const newImages = (data.images as string[]).filter((img: string) => !existing.has(img))
          return [...prev, ...newImages].slice(0, 5)
        })
      } else if (data.image && !images.includes(data.image) && images.length < 5) {
        setImages((prev) => [...prev, data.image].slice(0, 5))
      }

      toast.success("Product details filled")
    } catch {
      toast.error("Failed to fetch URL")
    }
    setFetching(false)
  }

  async function onSubmit(data: z.infer<typeof productSchema>) {
    setLoading(true)

    const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0)

    const payload = {
      ...data,
      store_id: storeId,
      image_urls: images,
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
        toast.error(error?.message || "Failed to create product")
        setLoading(false)
        return
      }
      productId = newProduct.id
    }

    // Sync variants
    if (productId) {
      if (validOptions.length === 0) {
        // No options — delete all variants
        await supabase.from("product_variants").delete().eq("product_id", productId)
      } else {
        // Delete old variants
        await supabase.from("product_variants").delete().eq("product_id", productId)

        // Insert new variants
        if (variants.length > 0) {
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
            toast.error("Product saved but variants failed: " + varError.message)
            setLoading(false)
            return
          }
        }
      }
    }

    toast.success(initialData ? "Product updated" : "Product added")
    setLoading(false)
    router.push("/dashboard/products")
  }

  const hasChanges = isDirty || imagesChanged || optionsChanged

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Select
            value={watch("status")}
            onValueChange={(v) => { setValue("status", v as "active" | "draft", { shouldDirty: true }) }}
          >
            <SelectTrigger className="h-8 w-[130px] border-transparent bg-transparent px-2 hover:bg-muted/50">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${watch("status") === "active" ? "bg-green-500" : "bg-red-400"}`} />
                  <span className="text-sm">{watch("status") === "active" ? "Active" : "Draft"}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Active
                </span>
              </SelectItem>
              <SelectItem value="draft">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Draft
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          {!initialData && (
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost">
                  <Globe className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import from URL</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Auto-fill product name, description, price and image from a URL
                </p>
                <div className="flex gap-2">
                  <Input
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    placeholder="https://example.com/product"
                    type="url"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      fetchUrlDetails()
                      setImportOpen(false)
                    }}
                    disabled={fetching}
                  >
                    {fetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span className="ml-2">{fetching ? "Fetching..." : "Fetch"}</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || (!!initialData && !hasChanges)}>
            {loading ? "Saving..." : initialData ? "Update product" : "Add product"}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" {...register("name")} placeholder="Product name" />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Describe your product" rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} placeholder="e.g. PROD-001 (optional)" />
        </div>

        <div className="space-y-2">
          <Label>Images</Label>
          <ImageUpload storeId={storeId} images={images} onImagesChange={(imgs) => { setImages(imgs); setImagesChanged(true) }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <Input id="price" type="number" step="0.01" className="pr-12" {...register("price", { valueAsNumber: true })} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
            </div>
            {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compare_at_price">Compare at price</Label>
            <div className="relative">
              <Input
                id="compare_at_price"
                type="number"
                step="0.01"
                className="pr-12"
                {...register("compare_at_price", {
                  setValueAs: (v: string) => {
                    if (v === "" || v === undefined) return undefined
                    const n = parseFloat(v)
                    return isNaN(n) ? undefined : n
                  },
                })}
                placeholder="Optional"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
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
            <Label>Track stock</Label>
          </div>
          {trackStock && (
            <div className="space-y-2">
              <Label htmlFor="stock">Stock quantity</Label>
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
            <Label>Product Options</Label>
            <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={addOption}>
              + Add new option
            </button>
          </div>

          {options.map((option, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="w-36 shrink-0 space-y-1">
                <Label className="text-xs text-muted-foreground">Option name</Label>
                <Input
                  value={option.name}
                  onChange={(e) => updateOption(i, "name", e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Option values</Label>
                <OptionValuesInput
                  values={option.values}
                  onChange={(values) => updateOption(i, "values", values)}
                  placeholder="Type a value and press Enter"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5 shrink-0"
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
              <Label>Variants ({variants.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={setAllPrices}>
                Set all prices from base
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Variant</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Compare at</th>
                    <th className="px-3 py-2 text-left font-medium">SKU</th>
                    {trackStock && <th className="px-3 py-2 text-left font-medium">Stock</th>}
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
                            className="h-8 w-28 pr-10"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
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
                            className="h-8 w-28 pr-10"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={variant.sku || ""}
                          onChange={(e) => updateVariantField(i, "sku", e.target.value)}
                          placeholder="Optional"
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
