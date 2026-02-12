"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatPrice } from "@/lib/utils"
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

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

interface StoreViewDaily {
  view_date: string
  view_count: number
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getDaysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function fillDays(from: Date, to: Date): string[] {
  const days: string[] = []
  const current = new Date(from)
  current.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (current <= end) {
    days.push(current.toISOString().split("T")[0])
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
  const [views, setViews] = useState<StoreViewDaily[]>([])
  const [prevViews, setPrevViews] = useState<StoreViewDaily[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (!dateRange.from || !dateRange.to) return

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
          .from("store_views_daily")
          .select("view_date, view_count")
          .eq("store_id", storeId)
          .gte("view_date", fromDate.toISOString().split("T")[0])
          .lte("view_date", toDate.toISOString().split("T")[0]),
        supabase
          .from("orders")
          .select("total, status, created_at")
          .eq("store_id", storeId)
          .gte("created_at", prevFrom.toISOString())
          .lte("created_at", prevTo.toISOString()),
        supabase
          .from("store_views_daily")
          .select("view_date, view_count")
          .eq("store_id", storeId)
          .gte("view_date", prevFrom.toISOString().split("T")[0])
          .lte("view_date", prevTo.toISOString().split("T")[0]),
      ])

      const fetchedOrders = (ordersRes.data || []) as Order[]
      setOrders(fetchedOrders)
      setPrevOrders((prevOrdersRes.data || []) as Order[])
      setViews((viewsRes.data || []) as StoreViewDaily[])
      setPrevViews((prevViewsRes.data || []) as StoreViewDaily[])

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

  // Daily breakdowns for charts
  const allDays = dateRange.from && dateRange.to ? fillDays(dateRange.from, dateRange.to) : []

  const viewsByDay = new Map<string, number>()
  for (const v of views) {
    viewsByDay.set(v.view_date, (viewsByDay.get(v.view_date) || 0) + v.view_count)
  }

  const ordersByDay = new Map<string, number>()
  const revenueByDay = new Map<string, number>()
  for (const o of orders) {
    const day = o.created_at.split("T")[0]
    ordersByDay.set(day, (ordersByDay.get(day) || 0) + 1)
    revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(o.total))
  }

  // Build daily arrays
  const visitorsDaily = allDays.map((d) => viewsByDay.get(d) || 0)
  const conversionDaily = allDays.map((d) => {
    const dayViews = viewsByDay.get(d) || 0
    const dayOrders = ordersByDay.get(d) || 0
    return dayViews > 0 ? (dayOrders / dayViews) * 100 : 0
  })
  const aovDaily = allDays.map((d) => {
    const dayOrders = ordersByDay.get(d) || 0
    const dayRevenue = revenueByDay.get(d) || 0
    return dayOrders > 0 ? dayRevenue / dayOrders : 0
  })
  const salesDaily = allDays.map((d) => revenueByDay.get(d) || 0)
  const ordersDaily = allDays.map((d) => ordersByDay.get(d) || 0)

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
        <div className="py-8 text-center text-sm text-muted-foreground">{t("analytics.loading")}</div>
      ) : (
        <>
          {/* Metric cards grid */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            <MetricCard
              title={t("analytics.visitors")}
              value={totalVisitors.toString()}
              change={pctChange(totalVisitors, prevTotalVisitors)}
              data={visitorsDaily}
              days={allDays}
            />
            <MetricCard
              title={t("dashboard.orders")}
              value={orders.length.toString()}
              change={pctChange(orders.length, prevOrders.length)}
              data={ordersDaily}
              days={allDays}
            />
            <MetricCard
              title={t("analytics.sales")}
              value={formatPrice(totalRevenue, currency)}
              change={pctChange(totalRevenue, prevTotalRevenue)}
              data={salesDaily}
              days={allDays}
              isCurrency
              currency={currency}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            <MetricCard
              title={t("analytics.conversionRate")}
              value={`${conversionRate.toFixed(2)}%`}
              change={pctChange(conversionRate, prevConversionRate)}
              data={conversionDaily}
              days={allDays}
              isPercent
            />
            <MetricCard
              title={t("analytics.aov")}
              value={formatPrice(avgOrderValue, currency)}
              change={pctChange(avgOrderValue, prevAvgOrderValue)}
              data={aovDaily}
              days={allDays}
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
              data={allDays.map((d) => {
                const dayViews = viewsByDay.get(d) || 0
                const dayRevenue = revenueByDay.get(d) || 0
                return dayViews > 0 ? dayRevenue / dayViews : 0
              })}
              days={allDays}
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
  days,
}: {
  title: string
  value: string
  change: number
  data: number[]
  days: string[]
  isCurrency?: boolean
  isPercent?: boolean
  currency?: string
}) {
  const { t } = useTranslation()
  const isPositive = change >= 0
  const barCount = data.length
  // Show at most ~30 bars, aggregate if too many days
  const maxBars = 30
  let displayData = data
  let displayDays = days
  if (barCount > maxBars) {
    const chunkSize = Math.ceil(barCount / maxBars)
    displayData = []
    displayDays = []
    for (let i = 0; i < barCount; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      displayData.push(chunk.reduce((a, b) => a + b, 0) / chunk.length)
      displayDays.push(days[i])
    }
  }
  const displayMax = Math.max(...displayData, 0.01)

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
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
        {displayDays.length > 1 && (
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{displayDays[0]?.slice(5)}</span>
            <span>{displayDays[displayDays.length - 1]?.slice(5)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
