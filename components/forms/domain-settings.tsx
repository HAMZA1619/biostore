"use client"

import { useState, useEffect, useCallback } from "react"
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

interface VercelDomainConfig {
  name?: string
  apexName?: string
  verified?: boolean
  verification?: { type: string; domain: string; value: string }[]
}

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
  const [vercelConfig, setVercelConfig] = useState<VercelDomainConfig | null>(null)

  const fetchDomainConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/store/domain")
      const data = await res.json()
      if (data.vercel) {
        setVercelConfig(data.vercel)
      }
    } catch {
      // Silently fail — DNS instructions will fall back to defaults
    }
  }, [])

  useEffect(() => {
    if (currentDomain && !domainVerified) {
      fetchDomainConfig()
    }
  }, [currentDomain, domainVerified, fetchDomainConfig])

  const isApex = currentDomain ? !currentDomain.includes(".") || currentDomain.split(".").length === 2 : false

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
      if (data.vercel) {
        setVercelConfig(data.vercel)
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
        if (data.verification) {
          setVercelConfig((prev) => ({
            ...prev,
            verification: data.verification,
          }))
        }
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
      setVercelConfig(null)
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

  const dnsRecords: { type: string; name: string; value: string }[] = []

  if (currentDomain) {
    if (isApex) {
      dnsRecords.push({ type: "A", name: "@", value: "76.76.21.21" })
    } else {
      dnsRecords.push({ type: "CNAME", name: currentDomain.split(".")[0], value: "cname.vercel-dns.com" })
    }
  }

  const txtRecords = vercelConfig?.verification ?? []

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
                <div className="overflow-hidden rounded-md border">
                  <p className="px-4 pt-4 text-sm font-medium">{t("domain.dnsInstructions")}</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="w-16 px-4 py-2 text-start font-medium">{t("domain.dnsType")}</th>
                          <th className="w-32 px-4 py-2 text-start font-medium">{t("domain.dnsName")}</th>
                          <th className="px-4 py-2 text-start font-medium">{t("domain.dnsValue")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dnsRecords.map((record) => (
                          <tr key={record.type + record.name} className="border-b last:border-0">
                            <td className="px-4 py-2.5 font-medium">{record.type}</td>
                            <td className="px-4 py-2.5">
                              <CopyField value={record.name} onCopy={copyToClipboard} />
                            </td>
                            <td className="px-4 py-2.5">
                              <CopyField value={record.value} onCopy={copyToClipboard} />
                            </td>
                          </tr>
                        ))}
                        {txtRecords.map((v) => (
                          <tr key={v.domain} className="border-b last:border-0">
                            <td className="px-4 py-2.5 font-medium">{v.type}</td>
                            <td className="px-4 py-2.5">
                              <CopyField value={v.domain} onCopy={copyToClipboard} />
                            </td>
                            <td className="px-4 py-2.5">
                              <CopyField value={v.value} onCopy={copyToClipboard} truncate />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

function CopyField({ value, onCopy, truncate }: { value: string; onCopy: (v: string) => void; truncate?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className={`group inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 font-mono text-xs transition-colors hover:bg-muted/80 ${truncate ? "max-w-48 sm:max-w-64" : ""}`}
      title={value}
    >
      <span className={truncate ? "truncate" : ""}>{value}</span>
      <Copy className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
