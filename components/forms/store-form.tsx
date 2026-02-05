"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { storeSchema } from "@/lib/validations/store"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"

interface StoreFormProps {
  userId: string
  initialData?: {
    id: string
    name: string
    slug: string
    description: string | null
    phone: string | null
    city: string | null
    currency: string
    delivery_note: string | null
    payment_methods: string[]
    primary_color: string | null
    accent_color: string | null
    is_published: boolean
  } | null
}

export function StoreForm({ userId, initialData }: StoreFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      phone: initialData?.phone || "",
      city: initialData?.city || "",
      currency: initialData?.currency || "MAD",
      delivery_note: initialData?.delivery_note || "",
      payment_methods: (initialData?.payment_methods || ["cod"]) as ("cod" | "bank_transfer")[],
      primary_color: initialData?.primary_color || "#000000",
      accent_color: initialData?.accent_color || "#3B82F6",
    },
  })

  const name = watch("name")

  function autoSlug() {
    if (!initialData) {
      setValue("slug", slugify(name))
    }
  }

  async function onSubmit(data: z.infer<typeof storeSchema>) {
    setLoading(true)

    if (initialData) {
      const { error } = await supabase
        .from("stores")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", initialData.id)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Store updated")
    } else {
      const { error } = await supabase.from("stores").insert({
        ...data,
        owner_id: userId,
      })

      if (error) {
        if (error.code === "23505") {
          toast.error("This slug is already taken")
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }
      toast.success("Store created")
    }

    setLoading(false)
    router.refresh()
  }

  async function togglePublish() {
    if (!initialData) return
    const { error } = await supabase
      .from("stores")
      .update({ is_published: !initialData.is_published })
      .eq("id", initialData.id)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(initialData.is_published ? "Store unpublished" : "Store published")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Store name</Label>
        <Input
          id="name"
          {...register("name")}
          onBlur={autoSlug}
          placeholder="My Store"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Store URL</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_URL}/
          </span>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="my-store"
            disabled={!!initialData}
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-red-600">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="What do you sell?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">WhatsApp / Phone</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="+212 6XX XXX XXX"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery_note">Delivery note</Label>
        <Input
          id="delivery_note"
          {...register("delivery_note")}
          placeholder="e.g. Delivery: 30 MAD nationwide"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : initialData
              ? "Update store"
              : "Create store"}
        </Button>
        {initialData && (
          <Button type="button" variant="outline" onClick={togglePublish}>
            {initialData.is_published ? "Unpublish" : "Publish"}
          </Button>
        )}
      </div>
    </form>
  )
}
