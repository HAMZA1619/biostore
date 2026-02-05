"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema } from "@/lib/validations/product"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Wand2 } from "lucide-react"

interface ProductFormProps {
  storeId: string
  collections: { id: string; name: string }[]
  initialData?: {
    id: string
    name: string
    description: string | null
    price: number
    compare_at_price: number | null
    collection_id: string | null
    image_urls: string[]
    is_available: boolean
    product_type: string
    external_url: string | null
  } | null
}

export function ProductForm({ storeId, collections, initialData }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [images, setImages] = useState<string[]>(initialData?.image_urls || [])
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      compare_at_price: initialData?.compare_at_price || undefined,
      collection_id: initialData?.collection_id || "",
      is_available: initialData?.is_available ?? true,
      product_type: (initialData?.product_type as "regular" | "external") || "regular",
      external_url: initialData?.external_url || "",
    },
  })

  const productType = watch("product_type")

  async function fetchUrlDetails() {
    const url = getValues("external_url")
    if (!url) {
      toast.error("Enter a URL first")
      return
    }

    setFetching(true)
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to fetch URL")
        setFetching(false)
        return
      }

      if (data.title) setValue("name", data.title)
      if (data.description) setValue("description", data.description)
      if (data.price) setValue("price", data.price)
      if (data.image && !images.includes(data.image)) {
        setImages((prev) => [...prev, data.image])
      }

      toast.success("Product details filled")
    } catch {
      toast.error("Failed to fetch URL")
    }
    setFetching(false)
  }

  async function onSubmit(data: z.infer<typeof productSchema>) {
    setLoading(true)

    const payload = {
      ...data,
      store_id: storeId,
      image_urls: images,
      collection_id: data.collection_id || null,
      compare_at_price: data.compare_at_price || null,
      external_url: data.product_type === "external" ? data.external_url : null,
    }

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
      toast.success("Product updated")
    } else {
      const { error } = await supabase.from("products").insert(payload)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Product added")
    }

    setLoading(false)
    router.push("/dashboard/products")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Product type</Label>
        <Select
          defaultValue={initialData?.product_type || "regular"}
          onValueChange={(v) => setValue("product_type", v as "regular" | "external")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">Regular (COD / WhatsApp)</SelectItem>
            <SelectItem value="external">External link (redirect)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {productType === "regular"
            ? "Customers order on your store and send via WhatsApp"
            : "Customers are redirected to an external product page"}
        </p>
      </div>

      {productType === "external" && (
        <div className="space-y-2">
          <Label htmlFor="external_url">Product URL *</Label>
          <div className="flex gap-2">
            <Input
              id="external_url"
              {...register("external_url")}
              placeholder="https://example.com/product"
              type="url"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={fetchUrlDetails}
              disabled={fetching}
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span className="ml-2">{fetching ? "Fetching..." : "Fetch details"}</span>
            </Button>
          </div>
          {errors.external_url && (
            <p className="text-sm text-red-600">{errors.external_url.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUpload storeId={storeId} images={images} onImagesChange={setImages} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Product name</Label>
        <Input id="name" {...register("name")} placeholder="Product name" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} placeholder="Describe your product" rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (MAD)</Label>
          <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare_at_price">Compare at price</Label>
          <Input
            id="compare_at_price"
            type="number"
            step="0.01"
            {...register("compare_at_price", {
              setValueAs: (v: string) => {
                if (v === "" || v === undefined) return undefined
                const n = parseFloat(v)
                return isNaN(n) ? undefined : n
              },
            })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Collection</Label>
        <Select
          defaultValue={initialData?.collection_id || "none"}
          onValueChange={(v) => setValue("collection_id", v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No collection</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update product" : "Add product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
