"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DesignControls } from "./design-controls"
import { DesignPreview } from "./design-preview"
import type { DesignState } from "./design-preview"

interface StoreDesignData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  accent_color: string | null
  theme: string | null
  show_branding: boolean
  phone: string | null
}

interface DesignBuilderProps {
  store: StoreDesignData
}

export function DesignBuilder({ store }: DesignBuilderProps) {
  const [state, setState] = useState<DesignState>({
    logoUrl: store.logo_url,
    bannerUrl: store.banner_url,
    primaryColor: store.primary_color || "#000000",
    accentColor: store.accent_color || "#3B82F6",
    theme: (store.theme as DesignState["theme"]) || "default",
    showBranding: store.show_branding ?? true,
  })
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
        theme: state.theme,
        show_branding: state.showBranding,
        updated_at: new Date().toISOString(),
      })
      .eq("id", store.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Design saved")
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full space-y-4 lg:w-[400px]">
        <DesignControls state={state} onChange={handleChange} storeId={store.id} />
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
      <div className="flex-1 lg:sticky lg:top-20 lg:self-start">
        <DesignPreview state={state} storeName={store.name} phone={store.phone} />
      </div>
    </div>
  )
}
