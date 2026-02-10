"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import { BarChart3 } from "lucide-react"
import type { UseFormRegisterReturn } from "react-hook-form"
import "@/lib/i18n"

interface MarketingSettingsProps {
  register: (name: string) => UseFormRegisterReturn
}

export function MarketingSettings({ register }: MarketingSettingsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          {t("marketing.title")}
        </Label>
        <p className="text-xs text-muted-foreground">{t("marketing.description")}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("marketing.ga")}</Label>
        <p className="text-xs text-muted-foreground">{t("marketing.gaDescription")}</p>
        <div className="space-y-1">
          <Label htmlFor="ga_measurement_id" className="text-xs">{t("marketing.gaLabel")}</Label>
          <Input
            id="ga_measurement_id"
            placeholder={t("marketing.gaPlaceholder")}
            {...register("ga_measurement_id")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("marketing.fb")}</Label>
        <p className="text-xs text-muted-foreground">{t("marketing.fbDescription")}</p>
        <div className="space-y-1">
          <Label htmlFor="fb_pixel_id" className="text-xs">{t("marketing.fbLabel")}</Label>
          <Input
            id="fb_pixel_id"
            placeholder={t("marketing.fbPlaceholder")}
            {...register("fb_pixel_id")}
          />
        </div>
      </div>
    </div>
  )
}
