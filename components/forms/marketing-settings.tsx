"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import type { UseFormRegisterReturn } from "react-hook-form"
import "@/lib/i18n"

interface MarketingSettingsProps {
  register: (name: string) => UseFormRegisterReturn
}

export function MarketingSettings({ register }: MarketingSettingsProps) {
  const { t } = useTranslation()

  return (
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
  )
}
