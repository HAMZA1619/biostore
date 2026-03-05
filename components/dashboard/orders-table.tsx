"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { formatPrice } from "@/lib/utils"
import { RelativeDate } from "@/components/dashboard/relative-date"
import { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/constants"
import { CalendarIcon, CheckCircle, Loader2, PackageCheck, Search, Truck, X } from "lucide-react"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"

interface Order {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_country: string | null
  total: number
  currency: string
  status: string
  created_at: string
}

interface OrdersTableProps {
  initialOrders: Order[]
  hasMore: boolean
  markets: Array<{ id: string; name: string }>
}

const STATUS_I18N: Record<string, string> = {
  pending: "orders.statusPending",
  confirmed: "orders.statusConfirmed",
  shipped: "orders.statusShipped",
  delivered: "orders.statusDelivered",
  returned: "orders.statusReturned",
  canceled: "orders.statusCanceled",
}

const BULK_ACTION_CONFIG: Record<string, { labelKey: string; icon: typeof CheckCircle }> = {
  confirmed: { labelKey: "orders.confirmOrder", icon: CheckCircle },
  shipped: { labelKey: "orders.markShipped", icon: Truck },
  delivered: { labelKey: "orders.markDelivered", icon: PackageCheck },
  canceled: { labelKey: "orders.cancelOrder", icon: X },
}

const statusBadgeConfig: Record<string, { dot: string; bg: string; labelKey: string }> = {
  pending: { dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", labelKey: "orders.statusPending" },
  confirmed: { dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300", labelKey: "orders.statusConfirmed" },
  shipped: { dot: "bg-violet-400", bg: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300", labelKey: "orders.statusShipped" },
  delivered: { dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", labelKey: "orders.statusDelivered" },
  returned: { dot: "bg-orange-400", bg: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300", labelKey: "orders.statusReturned" },
  canceled: { dot: "bg-rose-400", bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300", labelKey: "orders.statusCanceled" },
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const cfg = statusBadgeConfig[status] || { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600", labelKey: status }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {t(cfg.labelKey)}
    </span>
  )
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

export function OrdersTable({ initialOrders, hasMore: initialHasMore, markets }: OrdersTableProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const [orders, setOrders] = useState(initialOrders)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [marketFilter, setMarketFilter] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dateFrom = dateRange?.from ? toLocalDate(dateRange.from) : ""
  const dateTo = dateRange?.to ? toLocalDate(dateRange.to) : ""
  const hasActiveFilters = !!statusFilter || !!marketFilter || !!dateFrom

  function buildParams(pageNum: number, searchQuery?: string) {
    const params = new URLSearchParams({ page: String(pageNum) })
    const q = searchQuery ?? search.trim()
    if (q) params.set("search", q)
    if (statusFilter) params.set("status", statusFilter)
    if (marketFilter) params.set("market", marketFilter)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    return params
  }

  const fetchFiltered = useCallback(async (params: URLSearchParams) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/orders/list?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setOrders(data.orders)
      setHasMore(data.hasMore)
      setPage(1)
    } finally {
      setSearching(false)
    }
  }, [])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim() && !hasActiveFilters) {
      setOrders(initialOrders)
      setHasMore(initialHasMore)
      setPage(1)
      return
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams({ page: "0" })
      if (value.trim()) params.set("search", value.trim())
      if (statusFilter) params.set("status", statusFilter)
      if (marketFilter) params.set("market", marketFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      fetchFiltered(params)
    }, 400)
  }

  function applyFilters(overrides: { status?: string; market?: string; dateFrom?: string; dateTo?: string }) {
    const next = {
      status: overrides.status ?? statusFilter,
      market: overrides.market ?? marketFilter,
      dateFrom: overrides.dateFrom ?? dateFrom,
      dateTo: overrides.dateTo ?? dateTo,
    }

    const anyFilter = !!next.status || !!next.market || !!next.dateFrom || !!search.trim()
    if (!anyFilter) {
      setOrders(initialOrders)
      setHasMore(initialHasMore)
      setPage(1)
      return
    }

    const params = new URLSearchParams({ page: "0" })
    if (search.trim()) params.set("search", search.trim())
    if (next.status) params.set("status", next.status)
    if (next.market) params.set("market", next.market)
    if (next.dateFrom) params.set("dateFrom", next.dateFrom)
    if (next.dateTo) params.set("dateTo", next.dateTo)
    fetchFiltered(params)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    applyFilters({ status: value })
  }

  function handleMarketChange(value: string) {
    setMarketFilter(value)
    applyFilters({ market: value })
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
    setSearch("")
    setStatusFilter("")
    setMarketFilter("")
    setDateRange(undefined)
    setOrders(initialOrders)
    setHasMore(initialHasMore)
    setPage(1)
  }

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = buildParams(page)
      const res = await fetch(`/api/orders/list?${params}`)
      if (!res.ok) {
        setHasMore(false)
        return
      }
      const data = await res.json()
      setOrders((prev) => [...prev, ...data.orders])
      setHasMore(data.hasMore)
      setPage((p) => p + 1)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)))
    }
  }

  // Compute valid bulk actions: transitions valid for ALL selected orders
  const bulkActions = (() => {
    if (selectedIds.size === 0) return []
    const selectedOrders = orders.filter((o) => selectedIds.has(o.id))
    const transitionSets = selectedOrders.map((o) => ORDER_STATUS_TRANSITIONS[o.status as OrderStatus] || [])
    if (transitionSets.length === 0) return []
    return transitionSets[0].filter((s) => transitionSets.every((set) => set.includes(s)))
  })()

  async function handleBulkAction(targetStatus: string) {
    setBulkLoading(true)
    try {
      const res = await fetch("/api/orders/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: Array.from(selectedIds), status: targetStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(t("orders.bulkSuccess", { count: data.updated }))
        setSelectedIds(new Set())
        // Refresh data
        const params = buildParams(0)
        fetchFiltered(params)
      }
    } finally {
      setBulkLoading(false)
    }
  }

  const isEmpty = orders.length === 0 && !search.trim() && !hasActiveFilters
  const noResults = orders.length === 0 && (!!search.trim() || hasActiveFilters)

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("orders.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("orders.searchPlaceholder")}
            className="ps-9 pe-9"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          )}
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          {(hasActiveFilters || search) && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 gap-1 text-xs">
              <X className="h-3 w-3" />
              {t("orders.clearFilters")}
            </Button>
          )}

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">{t("orders.allStatuses")}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{t(STATUS_I18N[s])}</option>
            ))}
          </select>

          {markets.length > 0 && (
            <select
              value={marketFilter}
              onChange={(e) => handleMarketChange(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">{t("orders.allMarkets")}</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}

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
          {t("orders.noResults")}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={orders.length > 0 && selectedIds.size === orders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t("orders.columns.number")}</TableHead>
                  <TableHead>{t("orders.columns.customer")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("orders.columns.phone")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("orders.columns.country")}</TableHead>
                  <TableHead>{t("orders.columns.total")}</TableHead>
                  <TableHead>{t("orders.columns.status")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("orders.columns.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="relative cursor-pointer">
                    <TableCell className="relative z-10">
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="absolute inset-0"
                      />
                      <span className="relative font-medium text-primary">
                        #{order.order_number}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-medium">{order.customer_name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{order.customer_phone}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{order.customer_country || "—"}</TableCell>
                    <TableCell>{formatPrice(order.total, order.currency)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <RelativeDate date={order.created_at} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedIds.size > 0 && (
            <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-2 rounded-lg border bg-background px-4 py-2.5 shadow-lg">
              <span className="text-sm font-medium">
                {t("orders.selectedCount", { count: selectedIds.size })}
              </span>
              <div className="mx-1 h-5 w-px bg-border" />
              {bulkActions.map((s) => {
                const config = BULK_ACTION_CONFIG[s]
                if (!config) return null
                const Icon = config.icon
                return (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "canceled" ? "outline" : "default"}
                    className={s === "canceled" ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400" : ""}
                    disabled={bulkLoading}
                    onClick={() => handleBulkAction(s)}
                  >
                    {bulkLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Icon className="mr-1.5 h-4 w-4" />}
                    {t(config.labelKey)}
                  </Button>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                {t("orders.clearSelection")}
              </Button>
            </div>
          )}

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
