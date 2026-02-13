"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  AVAILABLE_FIELDS,
  DEFAULT_FIELD_MAPPINGS,
  type FieldMapping,
  type RowGrouping,
} from "@/lib/integrations/apps/google-sheets"
import { GoogleSheetsIcon } from "@/components/icons/google-sheets"
import {
  Loader2,
  CheckCircle2,
  Unplug,
  FileSpreadsheet,
  ExternalLink,
  GripVertical,
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react"

interface InstalledIntegration {
  id: string
  store_id: string
  integration_id: string
  config: Record<string, unknown>
}

interface Props {
  storeId: string
  installed: InstalledIntegration | null
}

function initMappingsFromConfig(config: Record<string, unknown>): {
  enabled: FieldMapping[]
  disabled: string[]
} {
  const saved = config.field_mappings as FieldMapping[] | undefined
  if (saved && saved.length > 0) {
    const enabledKeys = new Set(saved.map((f) => f.key))
    const disabled = AVAILABLE_FIELDS
      .filter((f) => !enabledKeys.has(f.key))
      .map((f) => f.key)
    return { enabled: saved, disabled }
  }
  return {
    enabled: [...DEFAULT_FIELD_MAPPINGS],
    disabled: [],
  }
}

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : step}
              </div>
              <span
                className={`text-xs hidden sm:inline ${
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {labels[i]}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FieldMappingEditor({
  enabled,
  disabled,
  onChange,
  tEnabledFields,
  tDisabledFields,
  tColumnHeader,
}: {
  enabled: FieldMapping[]
  disabled: string[]
  onChange: (enabled: FieldMapping[], disabled: string[]) => void
  tEnabledFields: string
  tDisabledFields: string
  tColumnHeader: string
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function toggleField(key: string) {
    const inEnabled = enabled.findIndex((f) => f.key === key)
    if (inEnabled >= 0) {
      if (enabled.length <= 1) return
      const next = enabled.filter((_, i) => i !== inEnabled)
      onChange(next, [...disabled, key])
    } else {
      const def = AVAILABLE_FIELDS.find((f) => f.key === key)
      if (!def) return
      const existing = enabled.find((f) => f.key === key)
      onChange(
        [...enabled, { key, header: existing?.header || def.defaultHeader }],
        disabled.filter((k) => k !== key),
      )
    }
  }

  function updateHeader(key: string, header: string) {
    onChange(
      enabled.map((f) => (f.key === key ? { ...f, header } : f)),
      disabled,
    )
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const next = [...enabled]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    onChange(next, disabled)
    setDragIdx(idx)
  }

  function handleDragEnd() {
    setDragIdx(null)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {tEnabledFields}
        </p>
        <div className="space-y-1">
          {enabled.map((field, idx) => {
            const def = AVAILABLE_FIELDS.find((f) => f.key === field.key)
            return (
              <div
                key={field.key}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-md border bg-background p-2 ${
                  dragIdx === idx ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggleField(field.key)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-input accent-primary"
                />
                <span className="shrink-0 text-xs text-muted-foreground w-24 truncate">
                  {def?.defaultHeader || field.key}
                </span>
                <Input
                  value={field.header}
                  onChange={(e) => updateHeader(field.key, e.target.value)}
                  className="h-7 text-sm"
                  placeholder={tColumnHeader}
                />
              </div>
            )
          })}
        </div>
      </div>

      {disabled.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {tDisabledFields}
          </p>
          <div className="space-y-1">
            {disabled.map((key) => {
              const def = AVAILABLE_FIELDS.find((f) => f.key === key)
              if (!def) return null
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-2"
                >
                  <div className="w-3.5 shrink-0" />
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleField(key)}
                    className="h-3.5 w-3.5 shrink-0 rounded border-input accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    {def.defaultHeader}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function GoogleSheetsSetup({ storeId, installed }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const g = (key: string, opts?: Record<string, unknown>) => String(t(`integrations.googleSheets.${key}`, opts as never))

  const scopeError = searchParams.get("error") === "insufficient_scopes"
  const config = (installed?.config || {}) as Record<string, unknown>
  const isConnected = !!config.connected
  const hasSpreadsheet = !!config.spreadsheet_id

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [savingFields, setSavingFields] = useState(false)
  const [syncOldOrders, setSyncOldOrders] = useState(false)
  const [rowGrouping, setRowGrouping] = useState<RowGrouping>(
    (config.row_grouping as RowGrouping) || "per_product",
  )

  const [spreadsheetUrl, setSpreadsheetUrl] = useState("")
  const [createNew, setCreateNew] = useState(true)
  const [loadingHeaders, setLoadingHeaders] = useState(false)

  const initialRowGrouping = (config.row_grouping as RowGrouping) || "per_product"
  const initial = initMappingsFromConfig(config)
  const [enabledFields, setEnabledFields] = useState<FieldMapping[]>(
    initial.enabled,
  )
  const [disabledFields, setDisabledFields] = useState<string[]>(
    initial.disabled,
  )

  const hasChanges =
    rowGrouping !== initialRowGrouping ||
    JSON.stringify(enabledFields) !== JSON.stringify(initial.enabled) ||
    JSON.stringify(disabledFields) !== JSON.stringify(initial.disabled)

  function handleCancelChanges() {
    setEnabledFields(initial.enabled)
    setDisabledFields(initial.disabled)
    setRowGrouping(initialRowGrouping)
  }

  async function fetchHeaders(spreadsheetId: string) {
    setLoadingHeaders(true)
    try {
      const res = await fetch(
        `/api/integrations/google-sheets/spreadsheets?store_id=${storeId}&spreadsheet_id=${spreadsheetId}`,
      )
      if (res.ok) {
        const data = await res.json()
        const headers = data.headers as string[]
        if (headers && headers.length > 0) {
          const matched: FieldMapping[] = []
          const remaining = new Set(AVAILABLE_FIELDS.map((f) => f.key))

          for (const header of headers) {
            const lower = header.toLowerCase().trim()
            const match = AVAILABLE_FIELDS.find(
              (f) =>
                f.defaultHeader.toLowerCase() === lower ||
                f.key.replace(/_/g, " ") === lower,
            )
            if (match && remaining.has(match.key)) {
              matched.push({ key: match.key, header })
              remaining.delete(match.key)
            } else {
              matched.push({ key: `custom_${matched.length}`, header })
            }
          }

          const enabledFromHeaders = matched.filter((m) =>
            AVAILABLE_FIELDS.some((f) => f.key === m.key),
          )
          const disabledFromHeaders = AVAILABLE_FIELDS.filter(
            (f) => !enabledFromHeaders.some((e) => e.key === f.key),
          ).map((f) => f.key)

          if (enabledFromHeaders.length > 0) {
            setEnabledFields(enabledFromHeaders)
            setDisabledFields(disabledFromHeaders)
            return
          }
        }
      }
    } catch {
      // silent — keep defaults
    } finally {
      setLoadingHeaders(false)
    }
  }

  function handleFieldsChange(enabled: FieldMapping[], disabled: string[]) {
    setEnabledFields(enabled)
    setDisabledFields(disabled)
  }

  function refreshPage() {
    router.refresh()
  }

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations/google-sheets/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || g("connectFailed"))
        return
      }
      window.location.href = data.url
    } catch {
      toast.error(g("connectFailed"))
    } finally {
      setLoading(false)
    }
  }

  async function handleFinishSetup() {
    setLoading(true)
    try {
      const mappingsPayload = {
        field_mappings: enabledFields,
        row_grouping: rowGrouping,
      }

      if (createNew) {
        const res = await fetch(
          "/api/integrations/google-sheets/spreadsheets",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_id: storeId, ...mappingsPayload }),
          },
        )
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || g("createFailed"))
          setLoading(false)
          return
        }
      } else {
        const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
        const res = await fetch(
          "/api/integrations/google-sheets/spreadsheets",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              store_id: storeId,
              spreadsheet_id: spreadsheetId,
              ...mappingsPayload,
            }),
          },
        )
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || g("linkFailed"))
          setLoading(false)
          return
        }
      }

      toast.success(g("setupReady"))

      if (syncOldOrders) {
        handleSync().catch(() => {
          toast.error(g("syncFailed"))
        })
      }

      refreshPage()
    } catch {
      toast.error(g("setupFailed"))
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveFieldMappings() {
    if (!installed) return
    setSavingFields(true)
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: installed.id,
          config: { field_mappings: enabledFields, row_grouping: rowGrouping },
        }),
      })
      if (!res.ok) {
        toast.error(g("settingsSaveFailed"))
        return
      }
      toast.success(g("settingsSaved"))
    } catch {
      toast.error(g("settingsSaveFailed"))
    } finally {
      setSavingFields(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/integrations/google-sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || g("syncFailed"))
        return
      }
      toast.success(g("syncSuccess", { count: data.synced }))
    } catch {
      toast.error(g("syncFailed"))
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      await fetch("/api/integrations/google-sheets/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      })

      if (installed) {
        await fetch(`/api/integrations?id=${installed.id}`, {
          method: "DELETE",
        })
      }

      toast.success(g("disconnected"))
      router.push("/dashboard/integrations")
    } catch {
      toast.error(g("disconnectFailed"))
    } finally {
      setLoading(false)
      setShowDisconnect(false)
    }
  }

  function extractSpreadsheetId(input: string): string | null {
    const trimmed = input.trim()
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (match) return match[1]
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length > 10) return trimmed
    return null
  }

  function handleNextFromStep1() {
    if (!createNew) {
      const id = extractSpreadsheetId(spreadsheetUrl)
      if (!id) {
        toast.error(g("invalidUrl"))
        return
      }
      fetchHeaders(id)
    }
    setStep(2)
  }

  const rowGroupingOptions: {
    value: RowGrouping
    label: string
    description: string
  }[] = [
    {
      value: "per_product",
      label: g("perProduct"),
      description: g("perProductHint"),
    },
    {
      value: "per_order",
      label: g("perOrder"),
      description: g("perOrderHint"),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/integrations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <GoogleSheetsIcon className="h-5 w-5" style={{ color: "#0F9D58" }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{g("title")}</h1>
              <p className="text-sm text-muted-foreground">
                {g("description")}
              </p>
            </div>
          </div>
        </div>
        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950 border-red-200 dark:border-red-900"
            onClick={() => setShowDisconnect(true)}
          >
            <Unplug className="me-1.5 h-3.5 w-3.5" />
            {g("disconnectButton")}
          </Button>
        )}
      </div>

      {/* Scope error banner */}
      {scopeError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {g("insufficientPermissions")}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              {g("insufficientPermissionsHint")}
            </p>
          </div>
        </div>
      )}

      {/* State 1: Not connected */}
      {!isConnected && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-full bg-muted p-4">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium">{g("connectTitle")}</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {g("connectDescription")}
            </p>
          </div>
          <Button onClick={handleConnect} disabled={loading} className="mt-2">
            {loading ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="me-2 h-4 w-4" />
            )}
            {g("connectButton")}
          </Button>
        </div>
      )}

      {/* State 2: Connected, no spreadsheet — Setup Wizard */}
      {isConnected && !hasSpreadsheet && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {g("connectedBanner")}
              </p>
            </div>
            <StepIndicator current={step} total={2} labels={[g("chooseSpreadsheet"), g("settings")]} />
          </div>

          {/* Step 1: Select or create spreadsheet */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">{g("chooseSpreadsheet")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {g("chooseSpreadsheetHint")}
                </p>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    createNew ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="sheet-choice"
                    checked={createNew}
                    onChange={() => setCreateNew(true)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{g("createNew")}</p>
                    <p className="text-xs text-muted-foreground">
                      {g("createNewHint")}
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    !createNew ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="sheet-choice"
                    checked={!createNew}
                    onChange={() => setCreateNew(false)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium">{g("linkExisting")}</p>
                      <p className="text-xs text-muted-foreground">
                        {g("linkExistingHint")}
                      </p>
                    </div>
                    {!createNew && (
                      <Input
                        value={spreadsheetUrl}
                        onChange={(e) => setSpreadsheetUrl(e.target.value)}
                        placeholder={g("urlPlaceholder")}
                        className="text-sm"
                      />
                    )}
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleNextFromStep1}
                  disabled={!createNew && !spreadsheetUrl.trim()}
                >
                  {g("next")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Column mapping + Row grouping + Sync + Finish */}
          {step === 2 && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{g("columnMapping")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {g("columnMappingHint")}
                    {!createNew && g("headersMatched")}
                  </p>
                  {loadingHeaders ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {g("loadingHeaders")}
                    </div>
                  ) : (
                    <FieldMappingEditor
                      enabled={enabledFields}
                      disabled={disabledFields}
                      onChange={handleFieldsChange}
                      tEnabledFields={g("enabledFields")}
                      tDisabledFields={g("disabledFields")}
                      tColumnHeader={g("columnHeader")}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{g("rowGrouping")}</Label>
                    {rowGroupingOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                          rowGrouping === opt.value
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="row-grouping"
                          value={opt.value}
                          checked={rowGrouping === opt.value}
                          onChange={() => setRowGrouping(opt.value)}
                          className="mt-0.5 h-4 w-4 accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={syncOldOrders}
                      onChange={(e) => setSyncOldOrders(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{g("syncExisting")}</p>
                      <p className="text-xs text-muted-foreground">
                        {g("syncExistingHint")}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="me-2 h-4 w-4" />
                  {g("back")}
                </Button>
                <Button onClick={handleFinishSetup} disabled={loading || enabledFields.length === 0}>
                  {loading ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="me-2 h-4 w-4" />
                  )}
                  {g("finishSetup")}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* State 3: Connected + spreadsheet configured */}
      {isConnected && hasSpreadsheet && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0">
                <p className="font-medium text-green-800 dark:text-green-200">
                  {g("connectedStatus")}
                </p>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${config.spreadsheet_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-sm text-green-600 hover:underline dark:text-green-400"
                >
                  {(config.spreadsheet_name as string) || "Spreadsheet"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{g("columnMapping")}</Label>
              <p className="text-xs text-muted-foreground">
                {g("columnMappingHint")}
              </p>
              <FieldMappingEditor
                enabled={enabledFields}
                disabled={disabledFields}
                onChange={handleFieldsChange}
                tEnabledFields={g("enabledFields")}
                tDisabledFields={g("disabledFields")}
                tColumnHeader={g("columnHeader")}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{g("rowGrouping")}</Label>
                <p className="text-xs text-muted-foreground">
                  {g("rowGroupingHint")}
                </p>
                {rowGroupingOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                      rowGrouping === opt.value
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="row-grouping"
                      value={opt.value}
                      checked={rowGrouping === opt.value}
                      onChange={() => setRowGrouping(opt.value)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {hasChanges && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelChanges}
                  >
                    {g("cancel")}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveFieldMappings}
                    disabled={savingFields || enabledFields.length === 0}
                  >
                    {savingFields ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="me-2 h-4 w-4" />
                    )}
                    {g("saveChanges")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{g("disconnectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {g("disconnectDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{g("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {g("disconnectButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
