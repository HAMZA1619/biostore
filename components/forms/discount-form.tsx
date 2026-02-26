"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { discountSchema } from "@/lib/validations/discount"
import type { DiscountFormData } from "@/lib/validations/discount"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, getCurrencySymbol } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface DiscountFormProps {
  storeId: string
  currency: string
  initialData?: {
    id: string
    type: string
    code: string | null
    label: string
    discount_type: string
    discount_value: number
    minimum_order_amount: number | null
    max_uses: number | null
    max_uses_per_customer: number | null
    starts_at: string | null
    ends_at: string | null
    is_active: boolean
  }
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function DiscountForm({ storeId, currency, initialData }: DiscountFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData

  const [showDates, setShowDates] = useState(
    !!(initialData?.starts_at || initialData?.ends_at)
  )
  const [showLimit, setShowLimit] = useState(!!initialData?.max_uses)
  const [oneTimePerUser, setOneTimePerUser] = useState(
    initialData?.max_uses_per_customer === 1
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      code: initialData?.code || "",
      label: initialData?.label || "",
      discount_type: (initialData?.discount_type as "percentage" | "fixed") || "percentage",
      discount_value: initialData?.discount_value || 0,
      minimum_order_amount: initialData?.minimum_order_amount ?? undefined,
      max_uses: initialData?.max_uses ?? undefined,
      max_uses_per_customer: initialData?.max_uses_per_customer ?? undefined,
      starts_at: initialData?.starts_at ? initialData.starts_at.slice(0, 16) : null,
      ends_at: initialData?.ends_at ? initialData.ends_at.slice(0, 16) : null,
      is_active: initialData?.is_active ?? true,
    },
  })

  const discountType = watch("discount_type")
  const isActive = watch("is_active")

  const hasChanges = isDirty
    || showDates !== !!(initialData?.starts_at || initialData?.ends_at)
    || showLimit !== !!initialData?.max_uses
    || oneTimePerUser !== (initialData?.max_uses_per_customer === 1)

  function handleCancel() {
    reset()
    setShowDates(!!(initialData?.starts_at || initialData?.ends_at))
    setShowLimit(!!initialData?.max_uses)
    setOneTimePerUser(initialData?.max_uses_per_customer === 1)
  }

  async function onSubmit(data: DiscountFormData) {
    setLoading(true)
    try {
      const code = data.code.toUpperCase()
      const payload = {
        ...data,
        code,
        label: data.label || code,
        starts_at: showDates ? data.starts_at || null : null,
        ends_at: showDates ? data.ends_at || null : null,
        max_uses: showLimit ? data.max_uses || null : null,
        max_uses_per_customer: oneTimePerUser ? 1 : null,
        ...(isEdit ? { id: initialData.id } : { store_id: storeId }),
      }

      const res = await fetch("/api/discounts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || t("discountForm.saveFailed"))
        return
      }

      toast.success(isEdit ? t("discountForm.discountUpdated") : t("discountForm.discountCreated"))
      router.push("/dashboard/discounts")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-1 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">
            {isEdit ? t("discountForm.editDiscount") : t("discountForm.newDiscount")}
          </h1>
          <Select
            value={isActive ? "active" : "draft"}
            onValueChange={(v) => setValue("is_active", v === "active", { shouldDirty: true })}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                "h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
                isActive
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {t("products.statusActive")}
              </SelectItem>
              <SelectItem value="draft">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                {t("products.statusDraft")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEdit && hasChanges && (
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              {t("discountForm.cancel")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading || (isEdit && !hasChanges)}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEdit ? t("discountForm.updateDiscount") : t("discountForm.createDiscount")}
          </Button>
        </div>
      </div>
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">{t("discountForm.label")}</Label>
          <Input
            id="label"
            {...register("label")}
            placeholder={t("discountForm.labelPlaceholder")}
          />
        </div>

        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">{t("discountForm.code")}</Label>
          <div className="relative">
            <Input
              id="code"
              {...register("code")}
              placeholder={t("discountForm.enterCode")}
              className="uppercase pe-10"
              onChange={(e) => setValue("code", e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setValue("code", generateCode())}
              title={t("discountForm.generateCode")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          {errors.code && (
            <p className="text-sm text-red-500">{t(errors.code.message!)}</p>
          )}
        </div>

        {/* Type + Value */}
        <div className="flex gap-4">
          <div className="space-y-2 shrink-0">
            <Label>{t("discountForm.discountType")}</Label>
            <Select
              value={discountType}
              onValueChange={(v) => setValue("discount_type", v as "percentage" | "fixed", { shouldDirty: true })}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">{t("discountForm.percentage")}</SelectItem>
                <SelectItem value="fixed">{t("discountForm.fixedAmount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="discount_value">{t("discountForm.value")}</Label>
            <div className="relative">
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                min="0"
                {...register("discount_value", { valueAsNumber: true })}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {discountType === "percentage" ? "%" : getCurrencySymbol(currency)}
              </span>
            </div>
            {errors.discount_value && (
              <p className="text-sm text-red-500">{t(errors.discount_value.message!)}</p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 rounded-lg border p-4">
          {/* Set start and end dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show_dates" className="font-normal cursor-pointer">
                {t("discountForm.setDates")}
              </Label>
              <Switch
                id="show_dates"
                checked={showDates}
                onCheckedChange={(v) => {
                  setShowDates(v)
                  if (v && !watch("starts_at")) {
                    const now = new Date()
                    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    const fmt = (d: Date) => d.toISOString().slice(0, 16)
                    setValue("starts_at", fmt(now), { shouldDirty: true })
                    setValue("ends_at", fmt(tomorrow), { shouldDirty: true })
                  }
                }}
              />
            </div>
            {showDates && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="starts_at" className="text-xs text-muted-foreground">
                    {t("discountForm.startDate")}
                  </Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    {...register("starts_at")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ends_at" className="text-xs text-muted-foreground">
                    {t("discountForm.endDate")}
                  </Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    {...register("ends_at")}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Limit discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show_limit" className="font-normal cursor-pointer">
                {t("discountForm.limitDiscount")}
              </Label>
              <Switch
                id="show_limit"
                checked={showLimit}
                onCheckedChange={setShowLimit}
              />
            </div>
            {showLimit && (
              <Input
                id="max_uses"
                type="number"
                min="1"
                placeholder={t("discountForm.maxUsesPlaceholder")}
                {...register("max_uses", { valueAsNumber: true })}
                className="max-w-[200px]"
              />
            )}
          </div>

          <div className="border-t" />

          {/* One time usage per user */}
          <div className="flex items-center justify-between">
            <Label htmlFor="one_time_per_user" className="font-normal cursor-pointer">
              {t("discountForm.oneTimePerUser")}
            </Label>
            <Switch
              id="one_time_per_user"
              checked={oneTimePerUser}
              onCheckedChange={setOneTimePerUser}
            />
          </div>
        </div>

    </form>
  )
}
