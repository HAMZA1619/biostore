"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatPrice } from "@/lib/utils"
import { RelativeDate } from "@/components/dashboard/relative-date"
import { CalendarIcon, Loader2, X } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"

interface AbandonedCheckout {
  id: string
  customer_name: string | null
  customer_phone: string
  cart_items: { product_name: string; product_price: number; quantity: number }[]
  currency: string
  total: number
  status: string
  created_at: string
}

interface Props {
  initialCheckouts: AbandonedCheckout[]
  hasMore: boolean
}

const STATUSES = ["pending", "sent", "recovered", "expired"] as const

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  sent: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  recovered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  expired: "bg-gray-50 text-gray-500 dark:bg-gray-900/40 dark:text-gray-400",
}

const localeMap: Record<string, string> = { en: "en-US", ar: "ar-SA", fr: "fr-FR" }

function formatDateShort(date: Date) {
  const locale = localeMap[i18n.language] || i18n.language
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" })
}

function toLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function daysAgo(n: number): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - n)
  return { from, to }
}

const DATE_PRESETS = [
  { labelKey: "analytics.today", range: () => daysAgo(0) },
  { labelKey: "analytics.yesterday", range: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: d, to: d } } },
  { labelKey: "analytics.last7days", range: () => daysAgo(7) },
  { labelKey: "analytics.last14days", range: () => daysAgo(14) },
  { labelKey: "analytics.last30days", range: () => daysAgo(30) },
  { labelKey: "analytics.last60days", range: () => daysAgo(60) },
  { labelKey: "analytics.last90days", range: () => daysAgo(90) },
]

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])
  return isMobile
}

export function AbandonedCheckoutsTable({ initialCheckouts, hasMore: initialHasMore }: Props) {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const [checkouts, setCheckouts] = useState(initialCheckouts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [searching, setSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const dateFrom = dateRange?.from ? toLocalDate(dateRange.from) : ""
  const dateTo = dateRange?.to ? toLocalDate(dateRange.to) : ""
  const hasActiveFilters = !!statusFilter || !!dateFrom

  function buildParams(pageNum: number) {
    const params = new URLSearchParams({ page: String(pageNum) })
    if (statusFilter) params.set("status", statusFilter)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    return params
  }

  const fetchFiltered = useCallback(async (params: URLSearchParams) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/abandoned-checkouts/list?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setCheckouts(data.checkouts)
      setHasMore(data.hasMore)
      setPage(1)
    } finally {
      setSearching(false)
    }
  }, [])

  function applyFilters(overrides: { status?: string; dateFrom?: string; dateTo?: string }) {
    const next = {
      status: overrides.status ?? statusFilter,
      dateFrom: overrides.dateFrom ?? dateFrom,
      dateTo: overrides.dateTo ?? dateTo,
    }

    const anyFilter = !!next.status || !!next.dateFrom
    if (!anyFilter) {
      setCheckouts(initialCheckouts)
      setHasMore(initialHasMore)
      setPage(1)
      return
    }

    const params = new URLSearchParams({ page: "0" })
    if (next.status) params.set("status", next.status)
    if (next.dateFrom) params.set("dateFrom", next.dateFrom)
    if (next.dateTo) params.set("dateTo", next.dateTo)
    fetchFiltered(params)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    applyFilters({ status: value })
  }

  function handleDateRangeSelect(range: DateRange | undefined) {
    setDateRange(range)
    if (range?.from && range?.to) {
      setCalendarOpen(false)
      const from = toLocalDate(range.from)
      const to = toLocalDate(range.to)
      applyFilters({ dateFrom: from, dateTo: to })
    }
  }

  function handleDatePreset(range: DateRange) {
    setDateRange(range)
    setCalendarOpen(false)
    const from = range.from ? toLocalDate(range.from) : ""
    const to = range.to ? toLocalDate(range.to) : ""
    applyFilters({ dateFrom: from, dateTo: to })
  }

  function clearDateRange() {
    setDateRange(undefined)
    applyFilters({ dateFrom: "", dateTo: "" })
  }

  function clearAll() {
    setStatusFilter("")
    setDateRange(undefined)
    setCheckouts(initialCheckouts)
    setHasMore(initialHasMore)
    setPage(1)
  }

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = buildParams(page)
      const res = await fetch(`/api/abandoned-checkouts/list?${params}`)
      if (!res.ok) {
        setHasMore(false)
        return
      }
      const data = await res.json()
      setCheckouts((prev) => [...prev, ...data.checkouts])
      setHasMore(data.hasMore)
      setPage((p) => p + 1)
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = checkouts.length === 0 && !hasActiveFilters
  const noResults = checkouts.length === 0 && hasActiveFilters

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("abandonedCheckouts.title")}</h1>
        <p className="py-8 text-center text-muted-foreground">
          {t("abandonedCheckouts.empty")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{t("abandonedCheckouts.title")}</h1>
        <div className="ms-auto flex flex-wrap items-center gap-2">
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 gap-1 text-xs">
            <X className="h-3 w-3" />
            {t("abandonedCheckouts.clearFilters")}
          </Button>
        )}

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">{t("abandonedCheckouts.allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(`abandonedCheckouts.statusLabels.${s}`)}</option>
          ))}
        </select>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 font-normal">
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.from && dateRange?.to
                ? `${formatDateShort(dateRange.from)} - ${formatDateShort(dateRange.to)}`
                : t("analytics.pickDateRange")}
              {dateRange?.from && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); clearDateRange() }}
                  className="ms-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className={isMobile ? "flex flex-col" : "flex"}>
              <div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={isMobile ? 1 : 2}
                  disabled={{ after: new Date() }}
                />
              </div>
              <div className={isMobile ? "border-t flex flex-wrap gap-1 p-2" : "border-s p-2 space-y-1"}>
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.labelKey}
                    type="button"
                    className={isMobile
                      ? "rounded-md px-2.5 py-1 text-xs hover:bg-accent whitespace-nowrap"
                      : "block w-full rounded-md px-3 py-1.5 text-start text-sm hover:bg-accent whitespace-nowrap"
                    }
                    onClick={() => handleDatePreset(preset.range())}
                  >
                    {t(preset.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {searching ? (
        <div className="py-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : noResults ? (
        <div className="py-12 text-center text-muted-foreground">
          {t("abandonedCheckouts.noResults")}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("abandonedCheckouts.customer")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("abandonedCheckouts.phone")}</TableHead>
                  <TableHead className="text-end">{t("abandonedCheckouts.total")}</TableHead>
                  <TableHead>{t("abandonedCheckouts.status")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("abandonedCheckouts.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((c) => {
                  const itemCount = c.cart_items?.reduce((sum, i) => sum + i.quantity, 0) || 0
                  return (
                    <TableRow key={c.id} className="relative cursor-pointer">
                      <TableCell>
                        <Link
                          href={`/dashboard/abandoned-checkouts/${c.id}`}
                          className="absolute inset-0"
                        />
                        <div className="relative min-w-0">
                          <p className="truncate font-medium">{c.customer_name || c.customer_phone}</p>
                          <p className="truncate text-xs text-muted-foreground sm:hidden" dir="ltr">
                            {c.customer_name ? c.customer_phone : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {itemCount} {itemCount === 1 ? t("abandonedCheckouts.item") : t("abandonedCheckouts.items")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell"><span dir="ltr">{c.customer_phone}</span></TableCell>
                      <TableCell className="text-end">{formatPrice(c.total, c.currency)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || ""}`}>
                          {t(`abandonedCheckouts.statusLabels.${c.status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <RelativeDate date={c.created_at} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("orders.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
