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
import "@/lib/i18n"

interface StoreDesignData {
  id: string
  name: string
  slug: string
  currency: string
  design_settings: Record<string, unknown>
}

interface DesignBuilderProps {
  store: StoreDesignData
}

export function DesignBuilder({ store }: DesignBuilderProps) {
  const { t } = useTranslation()
  const initialState = useRef(parseDesignSettings(store.design_settings))
  const [state, setState] = useState<DesignState>(initialState.current)
  const [previewTab, setPreviewTab] = useState<PreviewTab>("store")
  const [saving, setSaving] = useState(false)
  const isDirty = JSON.stringify(state) !== JSON.stringify(initialState.current)
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", store.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t("design.designSaved"))
      initialState.current = { ...state }
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background pb-4">
        <h1 className="text-2xl font-bold">{t("design.title")}</h1>
        {isDirty && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setState({ ...initialState.current })}>
              {t("design.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("design.saving") : t("design.saveChanges")}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <DesignControls state={state} onChange={handleChange} storeId={store.id} previewTab={previewTab} onPreviewTabChange={setPreviewTab} />
        </div>
        <div className="hidden w-[360px] shrink-0 lg:block lg:sticky lg:top-20 lg:self-start">
          <DesignPreview
            state={state}
            storeName={store.name}
            currency={store.currency}
            previewTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>
      </div>
    </div>
  )
}
