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
import { useTranslation } from "react-i18next"
import { MarketingSettings } from "@/components/forms/marketing-settings"
import "@/lib/i18n"

interface StoreFormProps {
  userId: string
  title: string
  children?: React.ReactNode
  initialData?: {
    id: string
    name: string
    slug: string
    description: string | null
    city: string | null
    language: string
    currency: string
    payment_methods: ("cod")[]
    primary_color: string | null
    accent_color: string | null
    is_published: boolean
    ga_measurement_id: string | null
  } | null
}

export function StoreForm({ userId, title, initialData, children }: StoreFormProps) {
  const [loading, setLoading] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

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
      language: (initialData?.language as "en" | "fr" | "ar") || "en",
      currency: initialData?.currency || "MAD",
      payment_methods: ["cod"] as const,
      primary_color: initialData?.primary_color || "#000000",
      accent_color: initialData?.accent_color || "#3B82F6",
      ga_measurement_id: initialData?.ga_measurement_id || "",
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
      toast.success(t("storeForm.storeUpdated"))
    } else {
      const { error } = await supabase.from("stores").insert({
        ...data,
        owner_id: userId,
      })

      if (error) {
        if (error.code === "23505") {
          toast.error(t("storeForm.slugTaken"))
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }
      toast.success(t("storeForm.storeCreated"))
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
    toast.success(initialData.is_published ? t("storeForm.storeUnpublished") : t("storeForm.storePublished"))
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t(title)}</h1>
        <div className="flex gap-3">
          {initialData && (
            <Button type="button" variant="outline" onClick={togglePublish}>
              {initialData.is_published ? t("storeForm.unpublish") : t("storeForm.publish")}
            </Button>
          )}
          <Button type="submit" disabled={loading || (!!initialData && !isDirty)}>
            {loading
              ? t("storeForm.saving")
              : initialData
                ? t("storeForm.updateStore")
                : t("storeForm.createStore")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("storeForm.storeName")}</Label>
        <Input
          id="name"
          {...register("name")}
          onBlur={autoSlug}
          placeholder={t("storeForm.storeNamePlaceholder")}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{t(errors.name.message!)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t("storeForm.storeUrl")}</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_URL}/
          </span>
          <Input
            id="slug"
            {...register("slug")}
            placeholder={t("storeForm.storeUrlPlaceholder")}
            disabled={!!initialData}
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-red-600">{t(errors.slug.message!)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("storeForm.description")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder={t("storeForm.descriptionPlaceholder")}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("storeForm.currency")}</Label>
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
                return curr ? `${curr.code} — ${curr.name}` : t("storeForm.selectCurrency")
              })()}
              <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandInput placeholder={t("storeForm.searchCurrency")} />
              <CommandList>
                <CommandEmpty>{t("storeForm.noCurrencyFound")}</CommandEmpty>
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
                          "me-2 h-4 w-4",
                          watch("currency") === c.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{c.code}</span>
                      <span className="ms-2 text-muted-foreground">{c.name}</span>
                      <span className="ms-auto text-muted-foreground">{c.symbol}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.currency && (
          <p className="text-sm text-red-600">{t(errors.currency.message!)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("storefront.storefrontLanguage")}</Label>
        <p className="text-xs text-muted-foreground">{t("storefront.storefrontLanguageHint")}</p>
        <div className="flex gap-2">
          {(["en", "fr", "ar"] as const).map((lang) => (
            <Button
              key={lang}
              type="button"
              variant={watch("language") === lang ? "default" : "outline"}
              size="sm"
              onClick={() => setValue("language", lang, { shouldDirty: true })}
            >
              {t(`language.${lang}`)}
            </Button>
          ))}
        </div>
      </div>
      </div>
      <div className="space-y-8">
        {children}
        {initialData && <MarketingSettings register={register as unknown as (name: string) => ReturnType<typeof register>} />}
      </div>
      </div>
    </form>
  )
}
