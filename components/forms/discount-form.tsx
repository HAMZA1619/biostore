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
import { getCurrencySymbol } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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

export function DiscountForm({ storeId, currency, initialData }: DiscountFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      type: (initialData?.type as "code" | "automatic") || "code",
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

  const type = watch("type")
  const discountType = watch("discount_type")
  const isActive = watch("is_active")

  async function onSubmit(data: DiscountFormData) {
    setLoading(true)
    try {
      const payload = {
        ...data,
        code: data.type === "code" ? data.code : null,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? t("discountForm.editDiscount") : t("discountForm.createDiscount")}
        </h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="is_active" className="text-sm text-muted-foreground">
            {t("discountForm.active")}
          </Label>
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(v) => setValue("is_active", v)}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type */}
        <div className="space-y-2">
          <Label>{t("discountForm.type")}</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "code" ? "default" : "outline"}
              size="sm"
              onClick={() => setValue("type", "code")}
            >
              {t("discountForm.couponCode")}
            </Button>
            <Button
              type="button"
              variant={type === "automatic" ? "default" : "outline"}
              size="sm"
              onClick={() => setValue("type", "automatic")}
            >
              {t("discountForm.automaticDiscount")}
            </Button>
          </div>
        </div>

        {/* Code */}
        {type === "code" && (
          <div className="space-y-2">
            <Label htmlFor="code">{t("discountForm.code")}</Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="e.g. SAVE20"
              className="uppercase"
              onChange={(e) => setValue("code", e.target.value.toUpperCase())}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{t(errors.code.message!)}</p>
            )}
          </div>
        )}

        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">{t("discountForm.label")}</Label>
          <Input
            id="label"
            {...register("label")}
            placeholder={t("discountForm.labelPlaceholder")}
          />
          {errors.label && (
            <p className="text-sm text-red-500">{t(errors.label.message!)}</p>
          )}
        </div>

        {/* Discount Type + Value */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("discountForm.discountType")}</Label>
            <Select
              value={discountType}
              onValueChange={(v) => setValue("discount_type", v as "percentage" | "fixed")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">{t("discountForm.percentage")}</SelectItem>
                <SelectItem value="fixed">{t("discountForm.fixedAmount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_value">
              {t("discountForm.value")}
              <span className="ms-1 text-muted-foreground">
                {discountType === "percentage" ? "%" : getCurrencySymbol(currency)}
              </span>
            </Label>
            <Input
              id="discount_value"
              type="number"
              step="0.01"
              min="0"
              {...register("discount_value", { valueAsNumber: true })}
            />
            {errors.discount_value && (
              <p className="text-sm text-red-500">{t(errors.discount_value.message!)}</p>
            )}
          </div>
        </div>

        {/* Minimum Order Amount */}
        <div className="space-y-2">
          <Label htmlFor="minimum_order_amount">
            {t("discountForm.minimumOrder")}
            <span className="ms-1 text-muted-foreground">({t("productForm.optional")})</span>
          </Label>
          <Input
            id="minimum_order_amount"
            type="number"
            step="0.01"
            min="0"
            {...register("minimum_order_amount", { valueAsNumber: true })}
            placeholder={`${getCurrencySymbol(currency)} 0.00`}
          />
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max_uses">
              {t("discountForm.maxUses")}
              <span className="ms-1 text-muted-foreground">({t("productForm.optional")})</span>
            </Label>
            <Input
              id="max_uses"
              type="number"
              min="1"
              {...register("max_uses", { valueAsNumber: true })}
              placeholder="∞"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_uses_per_customer">
              {t("discountForm.maxPerCustomer")}
              <span className="ms-1 text-muted-foreground">({t("productForm.optional")})</span>
            </Label>
            <Input
              id="max_uses_per_customer"
              type="number"
              min="1"
              {...register("max_uses_per_customer", { valueAsNumber: true })}
              placeholder="∞"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="starts_at">
              {t("discountForm.startDate")}
              <span className="ms-1 text-muted-foreground">({t("productForm.optional")})</span>
            </Label>
            <Input
              id="starts_at"
              type="datetime-local"
              {...register("starts_at")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends_at">
              {t("discountForm.endDate")}
              <span className="ms-1 text-muted-foreground">({t("productForm.optional")})</span>
            </Label>
            <Input
              id="ends_at"
              type="datetime-local"
              {...register("ends_at")}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEdit ? t("discountForm.updateDiscount") : t("discountForm.createDiscount")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("discountForm.cancel")}
          </Button>
        </div>
      </form>
    </div>
  )
}
