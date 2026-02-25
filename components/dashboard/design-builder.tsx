"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { parseDesignSettings } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DesignControls } from "./design-controls"
import { DesignPreview } from "./design-preview"
import type { DesignState, PreviewTab } from "./design-preview"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"
import "@/lib/i18n"

interface StoreDesignData {
  id: string
  name: string
  slug: string
  currency: string
  design_settings: Record<string, unknown>
  description: string | null
}

interface DesignBuilderProps {
  store: StoreDesignData
}

export function DesignBuilder({ store }: DesignBuilderProps) {
  const { t } = useTranslation()
  const initialState = useRef(parseDesignSettings(store.design_settings))
  const [state, setState] = useState<DesignState>(initialState.current)
  const initialDescription = useRef(store.description || "")
  const [description, setDescription] = useState(store.description || "")
  const [previewTab, setPreviewTab] = useState<PreviewTab>("store")
  const [saving, setSaving] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const isDirty = JSON.stringify(state) !== JSON.stringify(initialState.current) || description !== initialDescription.current
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
        design_settings: state,
        language: state.language,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", store.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t("design.designSaved"))
      initialState.current = { ...state }
      initialDescription.current = description
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4 px-1 sm:px-0">
      <div className="flex items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">{t("design.title")}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
          >
            {showMobilePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setState({ ...initialState.current }); setDescription(initialDescription.current) }}>
              {t("design.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t("design.saving") : t("design.saveChanges")}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile preview — shown when toggled */}
      {showMobilePreview && (
        <div className="flex justify-center pb-4 lg:hidden">
          <DesignPreview
            state={state}
            storeName={store.name}
            storeDescription={description}
            currency={store.currency}
            previewTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          <DesignControls state={state} onChange={handleChange} storeId={store.id} previewTab={previewTab} onPreviewTabChange={setPreviewTab} description={description} onDescriptionChange={setDescription} />
        </div>
        <div className="hidden w-[360px] shrink-0 lg:block lg:sticky lg:top-20 lg:self-start">
          <DesignPreview
            state={state}
            storeName={store.name}
            storeDescription={description}
            currency={store.currency}
            previewTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>
      </div>
    </div>
  )
}
