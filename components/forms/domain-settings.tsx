"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Globe, Copy, Trash2, CheckCircle, Clock, Loader2 } from "lucide-react"
import "@/lib/i18n"

interface DomainSettingsProps {
  currentDomain: string | null
  domainVerified: boolean
}

export function DomainSettings({ currentDomain, domainVerified }: DomainSettingsProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [domain, setDomain] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const appHostname = typeof window !== "undefined"
    ? new URL(process.env.NEXT_PUBLIC_APP_URL || window.location.origin).hostname
    : ""

  const serverIp = process.env.NEXT_PUBLIC_APP_SERVER_IP || ""

  async function handleSave() {
    if (!domain.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/store/domain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(t(data.error) || t("domain.invalidDomain"))
        return
      }
      toast.success(t("domain.domainSaved"))
      setDomain("")
      router.refresh()
    } catch {
      toast.error(t("domain.invalidDomain"))
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    setVerifying(true)
    try {
      const res = await fetch("/api/store/domain/verify", { method: "POST" })
      const data = await res.json()
      if (data.verified) {
        toast.success(t("domain.verificationSuccess"))
        router.refresh()
      } else {
        toast.error(t("domain.verificationFailed"))
      }
    } catch {
      toast.error(t("domain.verificationFailed"))
    } finally {
      setVerifying(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch("/api/store/domain", { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to remove domain")
        return
      }
      toast.success(t("domain.domainRemoved"))
      setDeleteOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to remove domain")
    } finally {
      setRemoving(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success(t("domain.copied"))
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            {t("domain.title")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("domain.description")}</p>
        </div>

        {!currentDomain ? (
          <div className="space-y-2">
            <Label htmlFor="domain">{t("domain.domainLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                placeholder={t("domain.domainPlaceholder")}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button onClick={handleSave} disabled={saving || !domain.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("domain.save")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-sm">{currentDomain}</code>
                {domainVerified ? (
                  <Badge variant="default" className="gap-1 bg-green-600">
                    <CheckCircle className="h-3 w-3" />
                    {t("domain.verified")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {t("domain.pending")}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-red-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => setDeleteOpen(true)}
                disabled={removing}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!domainVerified && (
              <>
                <div className="rounded-md border">
                  <p className="px-4 pt-4 text-sm font-medium">{t("domain.dnsInstructions")}</p>
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="px-4 py-2 text-start font-medium">{t("domain.dnsType")}</th>
                        <th className="px-4 py-2 text-start font-medium">{t("domain.dnsName")}</th>
                        <th className="px-4 py-2 text-start font-medium">{t("domain.dnsValue")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverIp && (
                        <tr className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">A</td>
                          <td className="px-4 py-2.5">
                            <CopyField value="@" onCopy={copyToClipboard} />
                          </td>
                          <td className="px-4 py-2.5">
                            <CopyField value={serverIp} onCopy={copyToClipboard} />
                          </td>
                        </tr>
                      )}
                      {appHostname && (
                        <tr className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">CNAME</td>
                          <td className="px-4 py-2.5">
                            <CopyField value="www" onCopy={copyToClipboard} />
                          </td>
                          <td className="px-4 py-2.5">
                            <CopyField value={appHostname} onCopy={copyToClipboard} />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Button onClick={handleVerify} disabled={verifying} variant="outline">
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("domain.verifying")}
                    </>
                  ) : (
                    t("domain.verify")
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("domain.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("domain.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("domain.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removing} className="bg-red-600 hover:bg-red-700">
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : t("domain.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CopyField({ value, onCopy }: { value: string; onCopy: (v: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="group inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 font-mono text-xs transition-colors hover:bg-muted/80"
    >
      {value}
      <Copy className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
