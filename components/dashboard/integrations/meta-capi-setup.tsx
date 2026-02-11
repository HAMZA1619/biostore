"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, CheckCircle2 } from "lucide-react"

interface InstalledIntegration {
  id: string
  store_id: string
  integration_id: string
  is_enabled: boolean
  config: Record<string, unknown>
}

interface Props {
  storeId: string
  installed: InstalledIntegration | null
  onDone: () => void
}

export function MetaCapiSetup({ storeId, installed, onDone }: Props) {
  const { t } = useTranslation()
  const config = installed?.config || {}

  const [pixelId, setPixelId] = useState((config.pixel_id as string) || "")
  const [accessToken, setAccessToken] = useState((config.access_token as string) || "")
  const [testEventCode, setTestEventCode] = useState((config.test_event_code as string) || "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!pixelId.trim() || !accessToken.trim()) return

    setSaving(true)
    try {
      const newConfig = {
        pixel_id: pixelId.trim(),
        access_token: accessToken.trim(),
        ...(testEventCode.trim() ? { test_event_code: testEventCode.trim() } : {}),
      }

      if (installed) {
        const res = await fetch("/api/integrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: installed.id, config: newConfig }),
        })
        if (!res.ok) {
          toast.error(t("integrations.connectFailed"))
          return
        }
      } else {
        const res = await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: storeId,
            integration_id: "meta-capi",
            config: newConfig,
          }),
        })
        if (!res.ok) {
          toast.error(t("integrations.connectFailed"))
          return
        }
      }

      toast.success(t("integrations.metaCapiSaved"))
      onDone()
    } catch {
      toast.error(t("integrations.connectFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {installed && !!config.pixel_id && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <p className="text-sm text-green-800 dark:text-green-200">
            {t("integrations.metaCapiSetupHint")}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="pixel_id">{t("integrations.metaCapiPixelId")}</Label>
        <Input
          id="pixel_id"
          placeholder="123456789012345"
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="access_token">{t("integrations.metaCapiAccessToken")}</Label>
        <Input
          id="access_token"
          type="password"
          placeholder="EAAx..."
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="test_event_code">{t("integrations.metaCapiTestCode")}</Label>
        <Input
          id="test_event_code"
          placeholder="TEST12345"
          value={testEventCode}
          onChange={(e) => setTestEventCode(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("integrations.metaCapiTestCodeHint")}
        </p>
      </div>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={saving || !pixelId.trim() || !accessToken.trim()}
      >
        {saving ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="me-2 h-4 w-4" />
        )}
        {t("integrations.metaCapiSave")}
      </Button>
    </div>
  )
}
