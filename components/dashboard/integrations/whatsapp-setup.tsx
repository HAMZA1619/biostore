"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, QrCode, Unplug } from "lucide-react"

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

export function WhatsAppSetup({ storeId, installed, onDone }: Props) {
  const { t } = useTranslation()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(
    (installed?.config?.connected as boolean) || false
  )
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  const checkStatus = useCallback(async () => {
    const res = await fetch(
      `/api/integrations/whatsapp/status?store_id=${storeId}`
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
  }, [storeId])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const isConnected = await checkStatus()
      if (isConnected) {
        clearInterval(interval)
        toast.success(t("integrations.whatsappConnected"))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [polling, checkStatus, t])

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
        onDone()
      }
    } catch {
      toast.error(t("integrations.disconnectFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {t("integrations.whatsappConnectedStatus")}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {t("integrations.whatsappConnectedHint")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700"
          onClick={handleDisconnect}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Unplug className="me-2 h-4 w-4" />
          )}
          {t("integrations.disconnect")}
        </Button>
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
