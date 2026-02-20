"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatPrice } from "@/lib/utils"
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"

interface AnalyticsProps {
  storeId: string
  currency: string
  firstName: string
}

interface Order {
  total: number
  status: string
  created_at: string
}

interface StoreViewHourly {
  view_hour: string
  view_count: number
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

function formatHourLabel(h: number): string {
  if (h === 0) return "12am"
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

function getDaysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function fillDays(from: Date, to: Date): string[] {
  const days: string[] = []
  const current = new Date(from)
  current.setHours(12, 0, 0, 0)
  const end = new Date(to)
  end.setHours(12, 0, 0, 0)
  while (current <= end) {
    days.push(toLocalDate(current))
    current.setDate(current.getDate() + 1)
  }
  return days
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
  { labelKey: "analytics.last180days", range: () => daysAgo(180) },
  { labelKey: "analytics.lastYear", range: () => daysAgo(365) },
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

export function DashboardAnalytics({ storeId, currency, firstName }: AnalyticsProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d })(),
    to: new Date(),
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [prevOrders, setPrevOrders] = useState<Order[]>([])
  const [views, setViews] = useState<StoreViewHourly[]>([])
  const [prevViews, setPrevViews] = useState<StoreViewHourly[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const cacheRef = useRef<Map<string, { orders: Order[]; prevOrders: Order[]; views: StoreViewHourly[]; prevViews: StoreViewHourly[] }>>(new Map())

  useEffect(() => {
    if (!dateRange.from || !dateRange.to) return

    const cacheKey = `${toLocalDate(dateRange.from)}_${toLocalDate(dateRange.to)}`
    const cached = cacheRef.current.get(cacheKey)

    if (cached) {
      setOrders(cached.orders)
      setPrevOrders(cached.prevOrders)
      setViews(cached.views)
      setPrevViews(cached.prevViews)
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      const supabase = createClient()

      const fromDate = new Date(dateRange.from!)
      fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(dateRange.to!)
      toDate.setHours(23, 59, 59, 999)

      // Calculate previous period for comparison
      const dayCount = getDaysBetween(fromDate, toDate)
      const prevFrom = new Date(fromDate)
      prevFrom.setDate(prevFrom.getDate() - dayCount - 1)
      const prevTo = new Date(fromDate)
      prevTo.setDate(prevTo.getDate() - 1)
      prevTo.setHours(23, 59, 59, 999)

      // Fetch current period data
      const [ordersRes, viewsRes, prevOrdersRes, prevViewsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total, status, created_at")
          .eq("store_id", storeId)
          .gte("created_at", fromDate.toISOString())
          .lte("created_at", toDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("store_views_hourly")
          .select("view_hour, view_count")
          .eq("store_id", storeId)
          .gte("view_hour", fromDate.toISOString())
          .lte("view_hour", toDate.toISOString()),
        supabase
          .from("orders")
          .select("total, status, created_at")
          .eq("store_id", storeId)
          .gte("created_at", prevFrom.toISOString())
          .lte("created_at", prevTo.toISOString()),
        supabase
          .from("store_views_hourly")
          .select("view_hour, view_count")
          .eq("store_id", storeId)
          .gte("view_hour", prevFrom.toISOString())
          .lte("view_hour", prevTo.toISOString()),
      ])

      const fetchedOrders = (ordersRes.data || []) as Order[]
      const fetchedPrevOrders = (prevOrdersRes.data || []) as Order[]
      const fetchedViews = (viewsRes.data || []) as StoreViewHourly[]
      const fetchedPrevViews = (prevViewsRes.data || []) as StoreViewHourly[]

      cacheRef.current.set(cacheKey, {
        orders: fetchedOrders,
        prevOrders: fetchedPrevOrders,
        views: fetchedViews,
        prevViews: fetchedPrevViews,
      })

      setOrders(fetchedOrders)
      setPrevOrders(fetchedPrevOrders)
      setViews(fetchedViews)
      setPrevViews(fetchedPrevViews)

      setLoading(false)
    }

    fetchData()
  }, [dateRange.from, dateRange.to, storeId])

  // Computed metrics
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
  const totalVisitors = views.reduce((sum, v) => sum + v.view_count, 0)
  const conversionRate = totalVisitors > 0 ? (orders.length / totalVisitors) * 100 : 0

  // Previous period metrics
  const prevTotalRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const prevAvgOrderValue = prevOrders.length > 0 ? prevTotalRevenue / prevOrders.length : 0
  const prevTotalVisitors = prevViews.reduce((sum, v) => sum + v.view_count, 0)
  const prevConversionRate = prevTotalVisitors > 0 ? (prevOrders.length / prevTotalVisitors) * 100 : 0

  function pctChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Determine if single-day view (show hourly) or multi-day (show daily)
  const isSingleDay = dateRange.from && dateRange.to &&
    toLocalDate(dateRange.from) === toLocalDate(dateRange.to)

  let chartLabels: string[]
  let visitorsChart: number[]
  let ordersChart: number[]
  let salesChart: number[]
  let conversionChart: number[]
  let aovChart: number[]
  let epcChart: number[]

  if (isSingleDay) {
    // Hourly breakdown — bucket by local hour (0–23)
    chartLabels = Array.from({ length: 24 }, (_, i) => formatHourLabel(i))

    const viewsByHour = new Map<number, number>()
    for (const v of views) {
      const h = new Date(v.view_hour).getHours()
      viewsByHour.set(h, (viewsByHour.get(h) || 0) + v.view_count)
    }

    const ordersByHour = new Map<number, number>()
    const revenueByHour = new Map<number, number>()
    for (const o of orders) {
      const h = new Date(o.created_at).getHours()
      ordersByHour.set(h, (ordersByHour.get(h) || 0) + 1)
      revenueByHour.set(h, (revenueByHour.get(h) || 0) + Number(o.total))
    }

    visitorsChart = Array.from({ length: 24 }, (_, i) => viewsByHour.get(i) || 0)
    ordersChart = Array.from({ length: 24 }, (_, i) => ordersByHour.get(i) || 0)
    salesChart = Array.from({ length: 24 }, (_, i) => revenueByHour.get(i) || 0)
    conversionChart = Array.from({ length: 24 }, (_, i) => {
      const hv = viewsByHour.get(i) || 0
      const ho = ordersByHour.get(i) || 0
      return hv > 0 ? (ho / hv) * 100 : 0
    })
    aovChart = Array.from({ length: 24 }, (_, i) => {
      const ho = ordersByHour.get(i) || 0
      const hr = revenueByHour.get(i) || 0
      return ho > 0 ? hr / ho : 0
    })
    epcChart = Array.from({ length: 24 }, (_, i) => {
      const hv = viewsByHour.get(i) || 0
      const hr = revenueByHour.get(i) || 0
      return hv > 0 ? hr / hv : 0
    })
  } else {
    // Daily breakdown — aggregate hourly data using local timezone
    const allDays = dateRange.from && dateRange.to ? fillDays(dateRange.from, dateRange.to) : []
    chartLabels = allDays.map((d) => d.slice(5))

    const viewsByDay = new Map<string, number>()
    for (const v of views) {
      const day = toLocalDate(new Date(v.view_hour))
      viewsByDay.set(day, (viewsByDay.get(day) || 0) + v.view_count)
    }

    const ordersByDay = new Map<string, number>()
    const revenueByDay = new Map<string, number>()
    for (const o of orders) {
      const day = toLocalDate(new Date(o.created_at))
      ordersByDay.set(day, (ordersByDay.get(day) || 0) + 1)
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(o.total))
    }

    visitorsChart = allDays.map((d) => viewsByDay.get(d) || 0)
    ordersChart = allDays.map((d) => ordersByDay.get(d) || 0)
    salesChart = allDays.map((d) => revenueByDay.get(d) || 0)
    conversionChart = allDays.map((d) => {
      const dv = viewsByDay.get(d) || 0
      const dor = ordersByDay.get(d) || 0
      return dv > 0 ? (dor / dv) * 100 : 0
    })
    aovChart = allDays.map((d) => {
      const dor = ordersByDay.get(d) || 0
      const dr = revenueByDay.get(d) || 0
      return dor > 0 ? dr / dor : 0
    })
    epcChart = allDays.map((d) => {
      const dv = viewsByDay.get(d) || 0
      const dr = revenueByDay.get(d) || 0
      return dv > 0 ? dr / dv : 0
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("analytics.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("analytics.greeting", { name: firstName })}
          </p>
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ms-auto gap-2 font-normal">
              <CalendarIcon className="h-4 w-4" />
              {dateRange.from && dateRange.to
                ? `${formatDateShort(dateRange.from)} - ${formatDateShort(dateRange.to)}`
                : t("analytics.pickDateRange")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className={isMobile ? "flex flex-col" : "flex"}>
              <div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) setDateRange(range)
                    if (range?.from && range?.to) setCalendarOpen(false)
                  }}
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
                    onClick={() => {
                      setDateRange(preset.range())
                      setCalendarOpen(false)
                    }}
                  >
                    {t(preset.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3 px-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-2 h-7 w-28" />
                  <Skeleton className="mt-2 h-3 w-32" />
                  <div className="mt-3 flex items-end gap-[2px]" style={{ height: 60 }}>
                    {Array.from({ length: 20 }).map((_, j) => (
                      <Skeleton
                        key={j}
                        className="flex-1 min-w-[2px] rounded-t"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3 px-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-7 w-20" />
                  <Skeleton className="mt-2 h-3 w-28" />
                  <div className="mt-3 flex items-end gap-[2px]" style={{ height: 60 }}>
                    {Array.from({ length: 20 }).map((_, j) => (
                      <Skeleton
                        key={j}
                        className="flex-1 min-w-[2px] rounded-t"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Metric cards grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <MetricCard
              title={t("analytics.visitors")}
              value={totalVisitors.toString()}
              change={pctChange(totalVisitors, prevTotalVisitors)}
              data={visitorsChart}
              labels={chartLabels}
            />
            <MetricCard
              title={t("dashboard.orders")}
              value={orders.length.toString()}
              change={pctChange(orders.length, prevOrders.length)}
              data={ordersChart}
              labels={chartLabels}
            />
            <MetricCard
              title={t("analytics.sales")}
              value={formatPrice(totalRevenue, currency)}
              change={pctChange(totalRevenue, prevTotalRevenue)}
              data={salesChart}
              labels={chartLabels}
              isCurrency
              currency={currency}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <MetricCard
              title={t("analytics.conversionRate")}
              value={`${conversionRate.toFixed(2)}%`}
              change={pctChange(conversionRate, prevConversionRate)}
              data={conversionChart}
              labels={chartLabels}
              isPercent
            />
            <MetricCard
              title={t("analytics.aov")}
              value={formatPrice(avgOrderValue, currency)}
              change={pctChange(avgOrderValue, prevAvgOrderValue)}
              data={aovChart}
              labels={chartLabels}
              isCurrency
              currency={currency}
            />
            <MetricCard
              title={t("analytics.epc")}
              value={formatPrice(totalVisitors > 0 ? totalRevenue / totalVisitors : 0, currency)}
              change={pctChange(
                totalVisitors > 0 ? totalRevenue / totalVisitors : 0,
                prevTotalVisitors > 0 ? prevTotalRevenue / prevTotalVisitors : 0
              )}
              data={epcChart}
              labels={chartLabels}
              isCurrency
              currency={currency}
            />
          </div>

        </>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  data,
  labels,
}: {
  title: string
  value: string
  change: number
  data: number[]
  labels: string[]
  isCurrency?: boolean
  isPercent?: boolean
  currency?: string
}) {
  const { t } = useTranslation()
  const isPositive = change >= 0
  const barCount = data.length
  const maxBars = 30
  let displayData = data
  let displayLabels = labels
  if (barCount > maxBars) {
    const chunkSize = Math.ceil(barCount / maxBars)
    displayData = []
    displayLabels = []
    for (let i = 0; i < barCount; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      displayData.push(chunk.reduce((a, b) => a + b, 0) / chunk.length)
      displayLabels.push(labels[i])
    }
  }
  const displayMax = Math.max(...displayData, 0.01)

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 truncate text-2xl font-bold">{value}</p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
            {isPositive ? "+" : ""}{change.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">{t("analytics.vsPrevPeriod")}</span>
        </div>
        {/* Mini bar chart */}
        <div className="mt-3 flex items-end gap-[2px]" style={{ height: 60 }}>
          {displayData.map((val, i) => (
            <div
              key={i}
              className="flex-1 min-w-[2px] rounded-t bg-primary/60 hover:bg-primary transition-colors"
              style={{
                height: `${Math.max((val / displayMax) * 100, 3)}%`,
                minHeight: 2,
              }}
            />
          ))}
        </div>
        {displayLabels.length > 1 && (
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{displayLabels[0]}</span>
            <span>{displayLabels[displayLabels.length - 1]}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
