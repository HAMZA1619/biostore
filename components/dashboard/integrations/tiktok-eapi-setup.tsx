"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, CheckCircle2, Monitor, Server, ChevronDown } from "lucide-react"

const SUPPORTED_EVENTS = [
  { name: "ViewContent", descKey: "tiktokEapiEventViewContentDesc", type: "pixel" as const },
  { name: "AddToCart", descKey: "tiktokEapiEventAddToCartDesc", type: "pixel" as const },
  { name: "InitiateCheckout", descKey: "tiktokEapiEventInitiateCheckoutDesc", type: "pixel" as const },
  { name: "CompletePayment", descKey: "tiktokEapiEventCompletePaymentDesc", type: "server" as const },
]

interface InstalledIntegration {
  id: string
  store_id: string
  integration_id: string
  config: Record<string, unknown>
}

interface Props {
  storeId: string
  installed: InstalledIntegration | null
  onDone: () => void
}

export function TiktokEapiSetup({ storeId, installed, onDone }: Props) {
  const { t } = useTranslation()
  const config = installed?.config || {}

  const [pixelCode, setPixelCode] = useState((config.pixel_code as string) || "")
  const [accessToken, setAccessToken] = useState((config.access_token as string) || "")
  const [testEventCode, setTestEventCode] = useState((config.test_event_code as string) || "")
  const [saving, setSaving] = useState(false)
  const [showEvents, setShowEvents] = useState(false)

  async function handleSave() {
    if (!pixelCode.trim() || !accessToken.trim()) return

    setSaving(true)
    try {
      const hasTestCode = !!testEventCode.trim()
      const newConfig = {
        pixel_code: pixelCode.trim(),
        access_token: accessToken.trim(),
        ...(hasTestCode ? { test_event_code: testEventCode.trim(), test_mode: true } : { test_mode: false }),
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
            integration_id: "tiktok-eapi",
            config: newConfig,
          }),
        })
        if (!res.ok) {
          toast.error(t("integrations.connectFailed"))
          return
        }
      }

      toast.success(t("integrations.tiktokEapiSaved"))
      onDone()
    } catch {
      toast.error(t("integrations.connectFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {installed && !!config.pixel_code && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <p className="text-sm text-green-800 dark:text-green-200">
            {t("integrations.tiktokEapiSetupHint")}
          </p>
        </div>
      )}

      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setShowEvents((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          {t("integrations.tiktokEapiSupportedEvents")}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showEvents ? "rotate-180" : ""}`} />
        </button>
        {showEvents && (
          <div className="divide-y border-t">
            {SUPPORTED_EVENTS.map((evt) => (
              <div key={evt.name + evt.type} className="flex items-center gap-3 px-3 py-2.5">
                {evt.type === "pixel" ? (
                  <Monitor className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                ) : (
                  <Server className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{evt.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(`integrations.${evt.descKey}`)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  evt.type === "pixel"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                }`}>
                  {evt.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pixel_code">{t("integrations.tiktokEapiPixelCode")}</Label>
        <Input
          id="pixel_code"
          placeholder="CXXXXXXXXXXXXXXXXX"
          value={pixelCode}
          onChange={(e) => setPixelCode(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tt_access_token">{t("integrations.tiktokEapiAccessToken")}</Label>
        <Input
          id="tt_access_token"
          type="password"
          placeholder="..."
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tt_test_event_code">{t("integrations.tiktokEapiTestCode")}</Label>
        <Input
          id="tt_test_event_code"
          placeholder="TEST12345"
          value={testEventCode}
          onChange={(e) => setTestEventCode(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={saving || !pixelCode.trim() || !accessToken.trim()}
      >
        {saving ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="me-2 h-4 w-4" />
        )}
        {t("integrations.tiktokEapiSave")}
      </Button>
    </div>
  )
}
