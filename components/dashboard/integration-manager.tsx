"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { APP_LIST, APPS } from "@/lib/integrations/registry"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { Activity, Puzzle } from "lucide-react"
import { WhatsAppSetup } from "@/components/dashboard/integrations/whatsapp-setup"
import { MetaCapiSetup } from "@/components/dashboard/integrations/meta-capi-setup"

interface InstalledIntegration {
  id: string
  store_id: string
  integration_id: string
  config: Record<string, unknown>
  installed_at: string
  updated_at: string
}

interface Props {
  storeId: string
  installedIntegrations: InstalledIntegration[]
}

export function IntegrationManager({ storeId, installedIntegrations }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const [setupAppId, setSetupAppId] = useState<string | null>(null)
  const [uninstallId, setUninstallId] = useState<string | null>(null)

  const installedMap = new Map(
    installedIntegrations.map((i) => [i.integration_id, i])
  )

  async function handleTestModeToggle(installed: InstalledIntegration) {
    const currentTestMode = !!(installed.config as Record<string, unknown>).test_mode
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: installed.id,
        config: { ...installed.config, test_mode: !currentTestMode },
      }),
    })
    if (res.ok) {
      toast.success(
        currentTestMode
          ? t("integrations.liveMode")
          : t("integrations.testMode")
      )
      router.refresh()
    }
  }

  async function handleUninstall() {
    if (!uninstallId) return

    const installed = installedIntegrations.find((i) => i.id === uninstallId)
    if (installed?.integration_id === "whatsapp") {
      await fetch("/api/integrations/whatsapp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })
    }

    const res = await fetch(`/api/integrations?id=${uninstallId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast.success(t("integrations.uninstalled"))
      router.refresh()
    }
    setUninstallId(null)
  }

  function renderSetupContent() {
    if (!setupAppId) return null

    switch (setupAppId) {
      case "whatsapp":
        return (
          <WhatsAppSetup
            storeId={storeId}
            installed={installedMap.get("whatsapp") || null}
            onDone={() => {
              setSetupAppId(null)
              router.refresh()
            }}
          />
        )
      case "meta-capi":
        return (
          <MetaCapiSetup
            storeId={storeId}
            installed={installedMap.get("meta-capi") || null}
            onDone={() => {
              setSetupAppId(null)
              router.refresh()
            }}
          />
        )
      default:
        return <p className="text-muted-foreground">{t("integrations.noSetup")}</p>
    }
  }

  const currentApp = setupAppId ? APPS[setupAppId] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("integrations.title")}</h1>
      </div>

      {APP_LIST.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {APP_LIST.map((app) => {
            const installed = installedMap.get(app.id)
            const Icon = app.icon
            const config = (installed?.config || {}) as Record<string, unknown>
            const hasTestCode = app.id === "meta-capi" && !!config.test_event_code
            const isTestMode = hasTestCode && !!config.test_mode
            return (
              <Card key={app.id}>
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" style={app.iconColor ? { color: app.iconColor } : undefined} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base truncate">{app.name}</CardTitle>
                      {installed && hasTestCode && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={isTestMode
                              ? "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            }
                          >
                            {isTestMode
                              ? t("integrations.test")
                              : t("integrations.live")}
                          </Badge>
                          <Switch
                            checked={!isTestMode}
                            onCheckedChange={() => handleTestModeToggle(installed)}
                          />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={installed ? "outline" : "default"}
                      onClick={() => setSetupAppId(app.id)}
                    >
                      {installed
                        ? t("integrations.configure")
                        : t("integrations.install")}
                    </Button>
                    {installed && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/integrations/${app.id}/events`}>
                            <Activity className="me-1.5 h-3.5 w-3.5" />
                            {t("integrations.events.link")}
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ms-auto text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950"
                          onClick={() => setUninstallId(installed.id)}
                        >
                          {t("integrations.uninstall")}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Puzzle className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("integrations.empty")}</p>
        </div>
      )}

      <Dialog
        open={!!setupAppId}
        onOpenChange={(open) => !open && setSetupAppId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentApp
                ? installedMap.has(currentApp.id)
                  ? t("integrations.configureTitle", { name: currentApp.name })
                  : t("integrations.installTitle", { name: currentApp.name })
                : ""}
            </DialogTitle>
          </DialogHeader>
          {renderSetupContent()}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!uninstallId}
        onOpenChange={(open) => !open && setUninstallId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("integrations.uninstallTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("integrations.uninstallDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("integrations.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUninstall}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("integrations.uninstall")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
