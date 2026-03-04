"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatPrice } from "@/lib/utils"
import { CalendarIcon, TrendingUp, TrendingDown, Package, ShoppingCart, Coins, Globe } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"

interface Market {
  id: string
  name: string
  slug: string
  currency: string
  is_default: boolean
  price_adjustment: number
}

interface AnalyticsProps {
  storeId: string
  currency: string
  markets: Market[]
  exchangeRates: Record<string, number>
  productCount: number
  totalOrders: Array<{ total: number; currency: string; status: string; market_id: string | null }>
  firstName: string
}

interface Order {
  total: number
  status: string
  created_at: string
  currency: string
  market_id: string | null
}

interface StoreViewHourly {
  view_hour: string
  view_count: number
  market_id: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-400",
  confirmed: "bg-blue-500",
  shipped: "bg-amber-500",
  delivered: "bg-emerald-500",
  returned: "bg-orange-500",
  canceled: "bg-red-500",
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

export function DashboardAnalytics({ storeId, currency, markets, exchangeRates, productCount, totalOrders, firstName }: AnalyticsProps) {
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

  // Convert an order total from its market currency to store base currency
  const marketMap = new Map(markets.map((m) => [m.id, m]))
  function toBaseCurrency(total: number, marketId: string | null): number {
    if (!marketId) return total
    const market = marketMap.get(marketId)
    if (!market || market.currency === currency) return total
    return total * (exchangeRates[market.currency] || 1)
  }

  // Overview stat cards (all-time, from server)
  const allTimeOrders = totalOrders.length
  const allTimeRevenue = totalOrders.reduce((sum, o) => sum + toBaseCurrency(Number(o.total), o.market_id), 0)
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
          .select("total, status, created_at, currency, market_id")
          .eq("store_id", storeId)
          .gte("created_at", fromDate.toISOString())
          .lte("created_at", toDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("store_views_hourly")
          .select("view_hour, view_count, market_id")
          .eq("store_id", storeId)
          .gte("view_hour", fromDate.toISOString())
          .lte("view_hour", toDate.toISOString()),
        supabase
          .from("orders")
          .select("total, status, created_at, currency, market_id")
          .eq("store_id", storeId)
          .gte("created_at", prevFrom.toISOString())
          .lte("created_at", prevTo.toISOString()),
        supabase
          .from("store_views_hourly")
          .select("view_hour, view_count, market_id")
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

  function orderRevenue(o: { total: number; market_id: string | null }): number {
    return toBaseCurrency(Number(o.total), o.market_id)
  }

  // Computed metrics (all markets combined in store base currency)
  const totalRevenue = orders.reduce((sum, o) => sum + orderRevenue(o), 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
  const totalVisitors = views.reduce((sum, v) => sum + v.view_count, 0)
  const conversionRate = totalVisitors > 0 ? (orders.length / totalVisitors) * 100 : 0

  // Previous period metrics
  const prevTotalRevenue = prevOrders.reduce((sum, o) => sum + orderRevenue(o), 0)
  const prevAvgOrderValue = prevOrders.length > 0 ? prevTotalRevenue / prevOrders.length : 0
  const prevTotalVisitors = prevViews.reduce((sum, v) => sum + v.view_count, 0)
  const prevConversionRate = prevTotalVisitors > 0 ? (prevOrders.length / prevTotalVisitors) * 100 : 0

  // Status counts — current period
  const statusCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    returned: orders.filter(o => o.status === "returned").length,
    canceled: orders.filter(o => o.status === "canceled").length,
  }
  const totalOrderCount = orders.length
  const confirmedOrBeyond = statusCounts.confirmed + statusCounts.shipped + statusCounts.delivered + statusCounts.returned
  const shippedPool = statusCounts.shipped + statusCounts.delivered + statusCounts.returned
  const confirmationRate = totalOrderCount > 0 ? (confirmedOrBeyond / totalOrderCount) * 100 : 0
  const deliveryRate = shippedPool > 0 ? (statusCounts.delivered / shippedPool) * 100 : 0
  const returnRate = shippedPool > 0 ? (statusCounts.returned / shippedPool) * 100 : 0

  // Status counts — previous period
  const prevStatusCounts = {
    pending: prevOrders.filter(o => o.status === "pending").length,
    confirmed: prevOrders.filter(o => o.status === "confirmed").length,
    shipped: prevOrders.filter(o => o.status === "shipped").length,
    delivered: prevOrders.filter(o => o.status === "delivered").length,
    returned: prevOrders.filter(o => o.status === "returned").length,
    canceled: prevOrders.filter(o => o.status === "canceled").length,
  }
  const prevConfirmedOrBeyond = prevStatusCounts.confirmed + prevStatusCounts.shipped + prevStatusCounts.delivered + prevStatusCounts.returned
  const prevShippedPool = prevStatusCounts.shipped + prevStatusCounts.delivered + prevStatusCounts.returned
  const prevConfirmationRate = prevOrders.length > 0 ? (prevConfirmedOrBeyond / prevOrders.length) * 100 : 0
  const prevDeliveryRate = prevShippedPool > 0 ? (prevStatusCounts.delivered / prevShippedPool) * 100 : 0
  const prevReturnRate = prevShippedPool > 0 ? (prevStatusCounts.returned / prevShippedPool) * 100 : 0

  // Revenue by status
  const revenueByStatus = {
    collected: orders.filter(o => o.status === "delivered").reduce((s, o) => s + orderRevenue(o), 0),
    inTransit: orders.filter(o => o.status === "shipped").reduce((s, o) => s + orderRevenue(o), 0),
    pending: orders.filter(o => o.status === "pending" || o.status === "confirmed").reduce((s, o) => s + orderRevenue(o), 0),
    lost: orders.filter(o => o.status === "canceled" || o.status === "returned").reduce((s, o) => s + orderRevenue(o), 0),
  }

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
  let confirmationRateChart: number[]
  let deliveryRateChart: number[]
  let returnRateChart: number[]

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
      revenueByHour.set(h, (revenueByHour.get(h) || 0) + orderRevenue(o))
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

    // COD KPI charts — hourly
    const confirmedByHour = new Map<number, number>()
    const shippedPoolByHour = new Map<number, number>()
    const deliveredByHour = new Map<number, number>()
    const returnedByHour = new Map<number, number>()
    for (const o of orders) {
      const h = new Date(o.created_at).getHours()
      if (o.status !== "pending" && o.status !== "canceled") {
        confirmedByHour.set(h, (confirmedByHour.get(h) || 0) + 1)
      }
      if (o.status === "shipped" || o.status === "delivered" || o.status === "returned") {
        shippedPoolByHour.set(h, (shippedPoolByHour.get(h) || 0) + 1)
      }
      if (o.status === "delivered") deliveredByHour.set(h, (deliveredByHour.get(h) || 0) + 1)
      if (o.status === "returned") returnedByHour.set(h, (returnedByHour.get(h) || 0) + 1)
    }
    confirmationRateChart = Array.from({ length: 24 }, (_, i) => {
      const total = ordersByHour.get(i) || 0
      const conf = confirmedByHour.get(i) || 0
      return total > 0 ? (conf / total) * 100 : 0
    })
    deliveryRateChart = Array.from({ length: 24 }, (_, i) => {
      const pool = shippedPoolByHour.get(i) || 0
      const del = deliveredByHour.get(i) || 0
      return pool > 0 ? (del / pool) * 100 : 0
    })
    returnRateChart = Array.from({ length: 24 }, (_, i) => {
      const pool = shippedPoolByHour.get(i) || 0
      const ret = returnedByHour.get(i) || 0
      return pool > 0 ? (ret / pool) * 100 : 0
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
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + orderRevenue(o))
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

    // COD KPI charts — daily
    const confirmedByDay = new Map<string, number>()
    const shippedPoolByDay = new Map<string, number>()
    const deliveredByDay = new Map<string, number>()
    const returnedByDay = new Map<string, number>()
    for (const o of orders) {
      const day = toLocalDate(new Date(o.created_at))
      if (o.status !== "pending" && o.status !== "canceled") {
        confirmedByDay.set(day, (confirmedByDay.get(day) || 0) + 1)
      }
      if (o.status === "shipped" || o.status === "delivered" || o.status === "returned") {
        shippedPoolByDay.set(day, (shippedPoolByDay.get(day) || 0) + 1)
      }
      if (o.status === "delivered") deliveredByDay.set(day, (deliveredByDay.get(day) || 0) + 1)
      if (o.status === "returned") returnedByDay.set(day, (returnedByDay.get(day) || 0) + 1)
    }
    confirmationRateChart = allDays.map((d) => {
      const total = ordersByDay.get(d) || 0
      const conf = confirmedByDay.get(d) || 0
      return total > 0 ? (conf / total) * 100 : 0
    })
    deliveryRateChart = allDays.map((d) => {
      const pool = shippedPoolByDay.get(d) || 0
      const del = deliveredByDay.get(d) || 0
      return pool > 0 ? (del / pool) * 100 : 0
    })
    returnRateChart = allDays.map((d) => {
      const pool = shippedPoolByDay.get(d) || 0
      const ret = returnedByDay.get(d) || 0
      return pool > 0 ? (ret / pool) * 100 : 0
    })
  }

  return (
    <div className="space-y-4">
      {/* Overview stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-3 px-4">
            <div className="rounded-md bg-primary/10 p-2">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.products")}</p>
              <p className="text-2xl font-bold">{productCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-3 px-4">
            <div className="rounded-md bg-primary/10 p-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.orders")}</p>
              <p className="text-2xl font-bold">{allTimeOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-3 px-4">
            <div className="rounded-md bg-primary/10 p-2">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.revenue")}</p>
              <p className="text-2xl font-bold">{formatPrice(allTimeRevenue, currency)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("analytics.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("analytics.greeting", { name: firstName })}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 font-normal">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3 px-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-2 h-3 w-24" />
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
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 rounded" style={{ width: `${100 - i * 20}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <Skeleton className="h-4 w-36 mb-3" />
              <Skeleton className="h-5 w-full rounded-full" />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-1 h-5 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

          {/* Row 3: COD Performance KPIs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <MetricCard
              title={t("analytics.confirmationRate")}
              value={`${confirmationRate.toFixed(1)}%`}
              change={pctChange(confirmationRate, prevConfirmationRate)}
              data={confirmationRateChart}
              labels={chartLabels}
              isPercent
            />
            <MetricCard
              title={t("analytics.deliveryRate")}
              value={`${deliveryRate.toFixed(1)}%`}
              change={pctChange(deliveryRate, prevDeliveryRate)}
              data={deliveryRateChart}
              labels={chartLabels}
              isPercent
            />
            <MetricCard
              title={t("analytics.returnRate")}
              value={`${returnRate.toFixed(1)}%`}
              change={pctChange(returnRate, prevReturnRate)}
              data={returnRateChart}
              labels={chartLabels}
              isPercent
            />
          </div>

          {/* Order Status Funnel */}
          {totalOrderCount > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-sm font-medium mb-4">{t("analytics.orderFunnel")}</p>
                <div className="space-y-2">
                  <FunnelStep
                    label={t("analytics.funnelAllOrders")}
                    count={totalOrderCount}
                    total={totalOrderCount}
                    color="bg-slate-400"
                  />
                  <FunnelStep
                    label={t("analytics.funnelConfirmed")}
                    count={confirmedOrBeyond}
                    total={totalOrderCount}
                    color="bg-blue-500"
                    dropLabel={t("analytics.funnelCanceledPending")}
                    dropCount={statusCounts.pending + statusCounts.canceled}
                  />
                  <FunnelStep
                    label={t("analytics.funnelShipped")}
                    count={shippedPool}
                    total={totalOrderCount}
                    color="bg-amber-500"
                    dropLabel={t("analytics.funnelNotShipped")}
                    dropCount={statusCounts.confirmed}
                  />
                  <FunnelStep
                    label={t("analytics.funnelDelivered")}
                    count={statusCounts.delivered}
                    total={totalOrderCount}
                    color="bg-emerald-500"
                    dropLabel={t("analytics.funnelReturnedLabel")}
                    dropCount={statusCounts.returned}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue by Status */}
          {totalOrderCount > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-sm font-medium mb-3">{t("analytics.revenueByStatus")}</p>
                <div className="h-5 w-full rounded-full overflow-hidden flex bg-muted">
                  {totalRevenue > 0 && (
                    <>
                      {revenueByStatus.collected > 0 && (
                        <div className="h-full bg-emerald-500" style={{ width: `${(revenueByStatus.collected / totalRevenue) * 100}%` }} />
                      )}
                      {revenueByStatus.inTransit > 0 && (
                        <div className="h-full bg-amber-500" style={{ width: `${(revenueByStatus.inTransit / totalRevenue) * 100}%` }} />
                      )}
                      {revenueByStatus.pending > 0 && (
                        <div className="h-full bg-blue-500" style={{ width: `${(revenueByStatus.pending / totalRevenue) * 100}%` }} />
                      )}
                      {revenueByStatus.lost > 0 && (
                        <div className="h-full bg-red-500" style={{ width: `${(revenueByStatus.lost / totalRevenue) * 100}%` }} />
                      )}
                    </>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">{t("analytics.collected")}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{formatPrice(revenueByStatus.collected, currency)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs text-muted-foreground">{t("analytics.inTransit")}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{formatPrice(revenueByStatus.inTransit, currency)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-muted-foreground">{t("analytics.pendingRevenue")}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{formatPrice(revenueByStatus.pending, currency)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-xs text-muted-foreground">{t("analytics.lostRevenue")}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{formatPrice(revenueByStatus.lost, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Status Distribution */}
          {totalOrderCount > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-sm font-medium mb-3">{t("analytics.statusDistribution")}</p>
                <div className="h-5 w-full rounded-full overflow-hidden flex bg-muted">
                  {(["pending", "confirmed", "shipped", "delivered", "returned", "canceled"] as const).map((status) => {
                    const count = statusCounts[status]
                    if (count === 0) return null
                    return (
                      <div
                        key={status}
                        className={`h-full ${STATUS_COLORS[status]}`}
                        style={{ width: `${(count / totalOrderCount) * 100}%` }}
                      />
                    )
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {(["pending", "confirmed", "shipped", "delivered", "returned", "canceled"] as const).map((status) => {
                    const count = statusCounts[status]
                    if (count === 0) return null
                    const labelKey = `orders.status${status.charAt(0).toUpperCase() + status.slice(1)}`
                    return (
                      <div key={status} className="flex items-center gap-1.5 text-xs">
                        <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                        <span className="text-muted-foreground">{t(labelKey)}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {markets.length >= 2 && (
            <MarketPerformanceCard
              orders={orders}
              markets={markets}
              currency={currency}
              toBaseCurrency={toBaseCurrency}
              t={t}
            />
          )}
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

function FunnelStep({
  label,
  count,
  total,
  color,
  dropLabel,
  dropCount,
}: {
  label: string
  count: number
  total: number
  color: string
  dropLabel?: string
  dropCount?: number
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-7 w-full rounded bg-muted overflow-hidden">
        <div
          className={`h-full rounded ${color} transition-all`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      {dropLabel != null && dropCount != null && dropCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{dropLabel}:</span>
          <span className="text-red-500 font-medium tabular-nums">
            {dropCount} ({total > 0 ? ((dropCount / total) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      )}
    </div>
  )
}

function MarketPerformanceCard({
  orders,
  markets,
  currency,
  toBaseCurrency,
  t,
}: {
  orders: Order[]
  markets: Market[]
  currency: string
  toBaseCurrency: (total: number, marketId: string | null) => number
  t: (key: string) => string
}) {
  const totalRevenueAll = orders.reduce((sum, o) => sum + toBaseCurrency(Number(o.total), o.market_id), 0)

  const rows = markets.map((m) => {
    const marketOrders = orders.filter((o) => o.market_id === m.id)
    const revenue = marketOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const aov = marketOrders.length > 0 ? revenue / marketOrders.length : 0
    const baseRevenue = marketOrders.reduce((sum, o) => sum + toBaseCurrency(Number(o.total), o.market_id), 0)
    const share = totalRevenueAll > 0 ? (baseRevenue / totalRevenueAll) * 100 : 0
    return { market: m, orderCount: marketOrders.length, revenue, aov, share, displayCurrency: m.currency }
  })

  // Include "No market" orders
  const noMarketOrders = orders.filter((o) => !o.market_id)
  if (noMarketOrders.length > 0) {
    const revenue = noMarketOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const aov = revenue / noMarketOrders.length
    const share = totalRevenueAll > 0 ? (revenue / totalRevenueAll) * 100 : 0
    rows.push({ market: { id: "", name: t("analytics.noMarket"), slug: "", currency, is_default: false, price_adjustment: 0 }, orderCount: noMarketOrders.length, revenue, aov, share, displayCurrency: currency })
  }

  rows.sort((a, b) => b.share - a.share)

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">{t("analytics.marketPerformance")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-start font-medium">{t("analytics.market")}</th>
                <th className="py-2 text-end font-medium">{t("dashboard.orders")}</th>
                <th className="py-2 text-end font-medium">{t("dashboard.revenue")}</th>
                <th className="py-2 text-end font-medium hidden sm:table-cell">{t("analytics.aov")}</th>
                <th className="py-2 text-end font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.market.id || "none"} className="border-b last:border-0">
                  <td className="py-2 font-medium">
                    {row.market.name}
                    {row.market.is_default && (
                      <span className="ms-1.5 text-[10px] text-muted-foreground">{t("analytics.default")}</span>
                    )}
                  </td>
                  <td className="py-2 text-end">{row.orderCount}</td>
                  <td className="py-2 text-end">{formatPrice(row.revenue, row.displayCurrency)}</td>
                  <td className="py-2 text-end hidden sm:table-cell">{formatPrice(row.aov, row.displayCurrency)}</td>
                  <td className="py-2 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="hidden sm:block h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(row.share, 100)}%` }} />
                      </div>
                      <span className="tabular-nums">{row.share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
