"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DesignControls } from "./design-controls"
import { DesignPreview } from "./design-preview"
import type { DesignState, PreviewTab } from "./design-preview"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface StoreDesignData {
  id: string
  name: string
  slug: string
  currency: string
  language: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  accent_color: string | null
  background_color: string | null
  text_color: string | null
  button_text_color: string | null
  font_family: string | null
  border_radius: string | null
  theme: string | null
  show_branding: boolean
  show_floating_cart: boolean
  show_search: boolean
  checkout_show_email: boolean
  checkout_show_country: boolean
  checkout_show_city: boolean
  checkout_show_note: boolean
  thank_you_message: string | null
}

interface DesignBuilderProps {
  store: StoreDesignData
}

export function DesignBuilder({ store }: DesignBuilderProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<DesignState>({
    logoUrl: store.logo_url,
    bannerUrl: store.banner_url,
    primaryColor: store.primary_color || "#000000",
    accentColor: store.accent_color || "#3B82F6",
    backgroundColor: store.background_color || "#ffffff",
    textColor: store.text_color || "#111111",
    buttonTextColor: store.button_text_color || "#ffffff",
    fontFamily: store.font_family || "Inter",
    borderRadius: (store.border_radius as DesignState["borderRadius"]) || "md",
    theme: (store.theme as DesignState["theme"]) || "default",
    showBranding: store.show_branding ?? true,
    showFloatingCart: store.show_floating_cart ?? true,
    showSearch: store.show_search ?? true,
    checkoutShowEmail: store.checkout_show_email ?? true,
    checkoutShowCountry: store.checkout_show_country ?? true,
    checkoutShowCity: store.checkout_show_city ?? true,
    checkoutShowNote: store.checkout_show_note ?? true,
    thankYouMessage: store.thank_you_message || "",
  })
  const [previewTab, setPreviewTab] = useState<PreviewTab>("store")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function handleChange(patch: Partial<DesignState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from("stores")
      .update({
        logo_url: state.logoUrl,
        banner_url: state.bannerUrl,
        primary_color: state.primaryColor,
        accent_color: state.accentColor,
        background_color: state.backgroundColor,
        text_color: state.textColor,
        button_text_color: state.buttonTextColor,
        font_family: state.fontFamily,
        border_radius: state.borderRadius,
        theme: state.theme,
        show_branding: state.showBranding,
        show_floating_cart: state.showFloatingCart,
        show_search: state.showSearch,
        checkout_show_email: state.checkoutShowEmail,
        checkout_show_country: state.checkoutShowCountry,
        checkout_show_city: state.checkoutShowCity,
        checkout_show_note: state.checkoutShowNote,
        thank_you_message: state.thankYouMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", store.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t("design.designSaved"))
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background pb-4">
        <h1 className="text-2xl font-bold">{t("design.title")}</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("design.saving") : t("design.saveChanges")}
        </Button>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full space-y-4 lg:w-[400px]">
          <DesignControls state={state} onChange={handleChange} storeId={store.id} activeTab={previewTab} />
        </div>
        <div className="flex-1 lg:sticky lg:top-20 lg:self-start">
          <DesignPreview
            state={state}
            storeName={store.name}
            currency={store.currency}
            storeLang={store.language || "en"}
            previewTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>
      </div>
    </div>
  )
}
