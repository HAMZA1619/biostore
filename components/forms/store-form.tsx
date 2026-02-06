"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { storeSchema } from "@/lib/validations/store"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { slugify, cn } from "@/lib/utils"
import { CURRENCIES } from "@/lib/constants"
import { Check, ChevronsUpDown } from "lucide-react"

interface StoreFormProps {
  userId: string
  title: string
  initialData?: {
    id: string
    name: string
    slug: string
    description: string | null
    city: string | null
    currency: string
    payment_methods: ("cod")[]
    primary_color: string | null
    accent_color: string | null
    is_published: boolean
  } | null
}

export function StoreForm({ userId, title, initialData }: StoreFormProps) {
  const [loading, setLoading] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      city: initialData?.city || "",
      currency: initialData?.currency || "MAD",
      payment_methods: ["cod"] as const,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-3">
          {initialData && (
            <Button type="button" variant="outline" onClick={togglePublish}>
              {initialData.is_published ? "Unpublish" : "Publish"}
            </Button>
          )}
          <Button type="submit" disabled={loading || (!!initialData && !isDirty)}>
            {loading
              ? "Saving..."
              : initialData
                ? "Update store"
                : "Create store"}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
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
        <Label>Currency</Label>
        <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={currencyOpen}
              className="w-full justify-between font-normal"
            >
              {(() => {
                const curr = CURRENCIES.find((c) => c.code === watch("currency"))
                return curr ? `${curr.code} — ${curr.name}` : "Select currency"
              })()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandInput placeholder="Search currency..." />
              <CommandList>
                <CommandEmpty>No currency found.</CommandEmpty>
                <CommandGroup>
                  {CURRENCIES.map((c) => (
                    <CommandItem
                      key={c.code}
                      value={`${c.code} ${c.name}`}
                      onSelect={() => {
                        setValue("currency", c.code, { shouldDirty: true })
                        setCurrencyOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          watch("currency") === c.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{c.code}</span>
                      <span className="ml-2 text-muted-foreground">{c.name}</span>
                      <span className="ml-auto text-muted-foreground">{c.symbol}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.currency && (
          <p className="text-sm text-red-600">{errors.currency.message}</p>
        )}
      </div>
      </div>
    </form>
  )
}
