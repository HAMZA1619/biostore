"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, QrCode, ShieldCheck, Languages, ChevronDown, Check } from "lucide-react"
import { WHATSAPP_LANGUAGES } from "@/lib/integrations/apps/whatsapp"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { IntegrationPageHeader } from "@/components/dashboard/integrations/integration-page-header"
import { IntegrationPageLayout } from "@/components/dashboard/integrations/integration-page-layout"

const WHATSAPP_EVENTS = [
  { id: "order.created", labelKey: "integrations.eventNewOrder" },
  { id: "order.status_changed", labelKey: "integrations.eventStatusChanged" },
  { id: "checkout.abandoned", labelKey: "integrations.eventAbandonedCheckout" },
] as const

interface InstalledIntegration {
  id: string
  store_id: string
  integration_id: string
  config: Record<string, unknown>
}

interface Props {
  storeId: string
  installed: InstalledIntegration | null
  onDone?: () => void
}

export function WhatsAppSetup({ storeId, installed, onDone }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const done = onDone ?? (() => router.refresh())
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState<string | null>(
    (installed?.config?.instance_name as string) || null
  )
  const [connected, setConnected] = useState(
    (installed?.config?.connected as boolean) || false
  )
  const savedEnabledEvents = (installed?.config?.enabled_events as string[]) ?? ["order.created"]
  const savedCodConfirmation = (installed?.config?.cod_confirmation_enabled as boolean) || false
  const savedMessageLanguage = (installed?.config?.message_language as string) || ""
  const [enabledEvents, setEnabledEvents] = useState<string[]>(savedEnabledEvents)
  const [codConfirmationEnabled, setCodConfirmationEnabled] = useState(savedCodConfirmation)
  const [messageLanguage, setMessageLanguage] = useState(savedMessageLanguage)
  const [langOpen, setLangOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasChanges =
    connected && (
      JSON.stringify([...enabledEvents].sort()) !== JSON.stringify([...savedEnabledEvents].sort()) ||
      codConfirmationEnabled !== savedCodConfirmation ||
      messageLanguage !== savedMessageLanguage
    )

  function handleDiscard() {
    setEnabledEvents(savedEnabledEvents)
    setCodConfirmationEnabled(savedCodConfirmation)
    setMessageLanguage(savedMessageLanguage)
  }
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  const checkStatus = useCallback(async () => {
    const params = new URLSearchParams({ store_id: storeId })
    if (instanceName) params.set("instance_name", instanceName)
    const res = await fetch(
      `/api/integrations/whatsapp/status?${params}`
    )
    if (!res.ok) return false
    const data = await res.json()
    if (data.connected) {
      setConnected(true)
      setQrCode(null)
      setPolling(false)
      return true
    }
    return false
  }, [storeId, instanceName])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const isConnected = await checkStatus()
      if (isConnected) {
        clearInterval(interval)
        toast.success(t("integrations.whatsappConnected"))
        done()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [polling, checkStatus, t, done])

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t("integrations.connectFailed"))
        return
      }

      if (data.instance_name) {
        setInstanceName(data.instance_name)
      }

      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64)
        setPolling(true)
      } else {
        toast.error("No QR code received. Check Evolution API logs.")
        setPolling(true)
        await checkStatus()
      }
    } catch {
      toast.error(t("integrations.connectFailed"))
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations/whatsapp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })

      if (res.ok) {
        setConnected(false)
        setQrCode(null)
        setPolling(false)
        toast.success(t("integrations.whatsappDisconnected"))
        done()
      }
    } catch {
      toast.error(t("integrations.disconnectFailed"))
    } finally {
      setLoading(false)
    }
  }

  function toggleEvent(eventId: string) {
    setEnabledEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    )
  }

  async function handleSaveEvents() {
    if (!installed) return
    setSaving(true)
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: installed.id,
          config: {
            enabled_events: enabledEvents,
            cod_confirmation_enabled: codConfirmationEnabled,
            message_language: messageLanguage,
          },
        }),
      })
      if (res.ok) {
        toast.success(t("integrations.saved"))
        done()
      }
    } catch {
      toast.error(t("integrations.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  function renderContent() {
    if (connected) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {t("integrations.whatsappConnectedStatus")}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t("integrations.whatsappConnectedHint")}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">{t("integrations.whatsappEventsTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("integrations.whatsappEventsDescription")}</p>
          </div>
          <div className="space-y-2">
            {WHATSAPP_EVENTS.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
              >
                <span className="text-sm">{t(evt.labelKey)}</span>
                <Switch
                  checked={enabledEvents.includes(evt.id)}
                  onCheckedChange={() => toggleEvent(evt.id)}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {t("integrations.whatsappAiNote")}
          </p>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{t("integrations.codConfirmationTitle")}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("integrations.codConfirmationDescription")}
            </p>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm">{t("integrations.codConfirmationEnable")}</span>
              <Switch
                checked={codConfirmationEnabled}
                onCheckedChange={(v) => setCodConfirmationEnabled(v)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{t("integrations.messageLanguageTitle")}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("integrations.messageLanguageDescription")}
            </p>
            <div className="space-y-2">
              <Popover open={langOpen} onOpenChange={setLangOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {messageLanguage
                      ? WHATSAPP_LANGUAGES.find((l) => l.code === messageLanguage)?.name ?? messageLanguage
                      : t("integrations.messageLanguageDefault")}
                    <ChevronDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("integrations.messageLanguageSearch")} />
                    <CommandList>
                      <CommandEmpty>{t("integrations.messageLanguageEmpty")}</CommandEmpty>
                      <CommandItem
                        value="auto"
                        onSelect={() => { setMessageLanguage(""); setLangOpen(false) }}
                      >
                        <Check className={`me-2 h-4 w-4 ${!messageLanguage ? "opacity-100" : "opacity-0"}`} />
                        {t("integrations.messageLanguageDefault")}
                      </CommandItem>
                      {WHATSAPP_LANGUAGES.map((lang) => (
                        <CommandItem
                          key={lang.code}
                          value={`${lang.name} ${lang.code}`}
                          onSelect={() => {
                            setMessageLanguage(lang.code)
                            setLangOpen(false)
                          }}
                        >
                          <Check className={`me-2 h-4 w-4 ${messageLanguage === lang.code ? "opacity-100" : "opacity-0"}`} />
                          {lang.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

        </div>
      )
    }

    if (qrCode) {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t("integrations.scanQrCode")}
            </p>
            {qrCode.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="h-64 w-64 rounded-lg border"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border bg-muted">
                <p className="text-center text-sm font-mono">{qrCode}</p>
              </div>
            )}
            {polling && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("integrations.waitingForScan")}
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={handleConnect}>
            {t("integrations.refreshQr")}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <QrCode className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-center text-sm text-muted-foreground">
            {t("integrations.whatsappSetupHint")}
          </p>
        </div>
        <Button className="w-full" onClick={handleConnect} disabled={loading}>
          {loading ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="me-2 h-4 w-4" />
          )}
          {t("integrations.connectWhatsApp")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <IntegrationPageHeader
        title="WhatsApp"
        description={t("integrations.whatsappSetupHint")}
        icon={WhatsAppIcon}
        iconColor="#25D366"
        installed={installed}
        storeId={storeId}
        integrationId="whatsapp"
        onBeforeUninstall={async () => {
          await fetch("/api/integrations/whatsapp/disconnect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_id: storeId }),
          })
        }}
      />
      <IntegrationPageLayout
        integrationId="whatsapp"
        installed={!!installed}
        hasChanges={!!hasChanges}
        saving={saving}
        onSave={handleSaveEvents}
        onDiscard={handleDiscard}
      >
        {renderContent()}
      </IntegrationPageLayout>
    </div>
  )
}
