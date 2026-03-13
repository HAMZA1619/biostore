"use client"

import { useEffect, useRef, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatPrice } from "@/lib/utils"
import { CalendarIcon, TrendingUp, TrendingDown, Package, ShoppingCart, Coins, BarChart3, AreaChartIcon } from "lucide-react"
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

const STATUS_HEX: Record<string, string> = {
  pending: "#fbbf24",
  confirmed: "#38bdf8",
  shipped: "#a78bfa",
  delivered: "#34d399",
  returned: "#fb923c",
  canceled: "#fb7185",
}

const REVENUE_HEX: Record<string, string> = {
  collected: "#059669",
  inTransit: "#7c3aed",
  pending: "#d97706",
  lost: "#dc2626",
}

function formatAxisValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return value.toString()
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

function toSlotKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  return `${mm}-${dd} ${hh}:00`
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
  const [chartType, setChartType] = useState<"area" | "bar">("bar")

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

  // Determine if hourly view (≤2 days) or daily view (>2 days)
  const diffMs = dateRange.from && dateRange.to ? dateRange.to.getTime() - dateRange.from.getTime() : 0
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  const isHourlyView = dateRange.from && dateRange.to && diffDays <= 2

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

  if (isHourlyView) {
    // Hourly breakdown — build slot keys like "MM-DD HH:00" for all hours in range
    const allSlots: string[] = []
    if (dateRange.from && dateRange.to) {
      const cursor = new Date(dateRange.from)
      cursor.setMinutes(0, 0, 0)
      const end = new Date(dateRange.to)
      end.setHours(23, 59, 59, 999)
      while (cursor <= end) {
        const mm = String(cursor.getMonth() + 1).padStart(2, "0")
        const dd = String(cursor.getDate()).padStart(2, "0")
        const hh = String(cursor.getHours()).padStart(2, "0")
        allSlots.push(`${mm}-${dd} ${hh}:00`)
        cursor.setHours(cursor.getHours() + 1)
      }
    }
    chartLabels = allSlots.map((s) => s.split(" ")[1])

    const viewsBySlot = new Map<string, number>()
    for (const v of views) {
      const key = toSlotKey(new Date(v.view_hour))
      viewsBySlot.set(key, (viewsBySlot.get(key) || 0) + v.view_count)
    }

    const ordersBySlot = new Map<string, number>()
    const revenueBySlot = new Map<string, number>()
    for (const o of orders) {
      const key = toSlotKey(new Date(o.created_at))
      ordersBySlot.set(key, (ordersBySlot.get(key) || 0) + 1)
      revenueBySlot.set(key, (revenueBySlot.get(key) || 0) + orderRevenue(o))
    }

    visitorsChart = allSlots.map((s) => viewsBySlot.get(s) || 0)
    ordersChart = allSlots.map((s) => ordersBySlot.get(s) || 0)
    salesChart = allSlots.map((s) => revenueBySlot.get(s) || 0)
    conversionChart = allSlots.map((s) => {
      const sv = viewsBySlot.get(s) || 0
      const so = ordersBySlot.get(s) || 0
      return sv > 0 ? (so / sv) * 100 : 0
    })
    aovChart = allSlots.map((s) => {
      const so = ordersBySlot.get(s) || 0
      const sr = revenueBySlot.get(s) || 0
      return so > 0 ? sr / so : 0
    })
    epcChart = allSlots.map((s) => {
      const sv = viewsBySlot.get(s) || 0
      const sr = revenueBySlot.get(s) || 0
      return sv > 0 ? sr / sv : 0
    })

    // COD KPI charts — hourly
    const confirmedBySlot = new Map<string, number>()
    const shippedPoolBySlot = new Map<string, number>()
    const deliveredBySlot = new Map<string, number>()
    const returnedBySlot = new Map<string, number>()
    for (const o of orders) {
      const key = toSlotKey(new Date(o.created_at))
      if (o.status !== "pending" && o.status !== "canceled") {
        confirmedBySlot.set(key, (confirmedBySlot.get(key) || 0) + 1)
      }
      if (o.status === "shipped" || o.status === "delivered" || o.status === "returned") {
        shippedPoolBySlot.set(key, (shippedPoolBySlot.get(key) || 0) + 1)
      }
      if (o.status === "delivered") deliveredBySlot.set(key, (deliveredBySlot.get(key) || 0) + 1)
      if (o.status === "returned") returnedBySlot.set(key, (returnedBySlot.get(key) || 0) + 1)
    }
    confirmationRateChart = allSlots.map((s) => {
      const total = ordersBySlot.get(s) || 0
      const conf = confirmedBySlot.get(s) || 0
      return total > 0 ? (conf / total) * 100 : 0
    })
    deliveryRateChart = allSlots.map((s) => {
      const pool = shippedPoolBySlot.get(s) || 0
      const del = deliveredBySlot.get(s) || 0
      return pool > 0 ? (del / pool) * 100 : 0
    })
    returnRateChart = allSlots.map((s) => {
      const pool = shippedPoolBySlot.get(s) || 0
      const ret = returnedBySlot.get(s) || 0
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
        {[
          { label: t("dashboard.products"), value: productCount.toLocaleString(), icon: Package },
          { label: t("dashboard.orders"), value: allTimeOrders.toLocaleString(), icon: ShoppingCart },
          { label: t("dashboard.revenue"), value: formatPrice(allTimeRevenue, currency), icon: Coins },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-2 truncate text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("analytics.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("analytics.greeting", { name: firstName })}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
        <div className="flex items-center rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`rounded p-1.5 transition-colors ${chartType === "area" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <AreaChartIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`rounded p-1.5 transition-colors ${chartType === "bar" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
        </div>
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
                  <div className="mt-3 flex items-end gap-[2px]" style={{ height: 150 }}>
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
                  <div className="mt-3 flex items-end gap-[2px]" style={{ height: 150 }}>
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
                  <div className="mt-3 flex items-end gap-[2px]" style={{ height: 150 }}>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3 px-4">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-[160px] w-[160px] rounded-full mx-auto" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 flex-1" />
                        <Skeleton className="h-3 w-10" />
                      </div>
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
              chartType={chartType}
              title={t("analytics.visitors")}
              value={totalVisitors.toString()}
              change={pctChange(totalVisitors, prevTotalVisitors)}
              data={visitorsChart}
              labels={chartLabels}
            />
            <MetricCard
              chartType={chartType}
              title={t("dashboard.orders")}
              value={orders.length.toString()}
              change={pctChange(orders.length, prevOrders.length)}
              data={ordersChart}
              labels={chartLabels}
            />
            <MetricCard
              chartType={chartType}
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
              chartType={chartType}
              title={t("analytics.conversionRate")}
              value={`${conversionRate.toFixed(2)}%`}
              change={pctChange(conversionRate, prevConversionRate)}
              data={conversionChart}
              labels={chartLabels}
              isPercent
            />
            <MetricCard
              chartType={chartType}
              title={t("analytics.aov")}
              value={formatPrice(avgOrderValue, currency)}
              change={pctChange(avgOrderValue, prevAvgOrderValue)}
              data={aovChart}
              labels={chartLabels}
              isCurrency
              currency={currency}
            />
            <MetricCard
              chartType={chartType}
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
              chartType={chartType}
              title={t("analytics.confirmationRate")}
              value={`${confirmationRate.toFixed(1)}%`}
              change={pctChange(confirmationRate, prevConfirmationRate)}
              data={confirmationRateChart}
              labels={chartLabels}
              isPercent
            />
            <MetricCard
              chartType={chartType}
              title={t("analytics.deliveryRate")}
              value={`${deliveryRate.toFixed(1)}%`}
              change={pctChange(deliveryRate, prevDeliveryRate)}
              data={deliveryRateChart}
              labels={chartLabels}
              isPercent
            />
            <MetricCard
              chartType={chartType}
              title={t("analytics.returnRate")}
              value={`${returnRate.toFixed(1)}%`}
              change={pctChange(returnRate, prevReturnRate)}
              data={returnRateChart}
              labels={chartLabels}
              isPercent
            />
          </div>

          {/* Order Funnel + Revenue by Status + Order Status Distribution — Donut Charts */}
          {totalOrderCount > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Delivery Success Donut */}
              {(statusCounts.delivered > 0 || statusCounts.returned > 0 || statusCounts.canceled > 0) && (
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">{t("analytics.deliverySuccess")}</p>
                    <DonutChart
                      segments={[
                        { value: statusCounts.delivered, color: "#14b8a6", label: t("analytics.successDelivered") },
                        { value: statusCounts.returned, color: "#fb923c", label: t("analytics.successReturned") },
                        { value: statusCounts.canceled, color: "#f43f5e", label: t("analytics.successCanceled") },
                      ].filter(s => s.value > 0).sort((a, b) => b.value - a.value)}
                      centerLabel={t("analytics.deliveryRate")}
                      centerValue={`${deliveryRate.toFixed(0)}%`}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Revenue by Status Donut */}
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t("analytics.revenueByStatus")}</p>
                  <DonutChart
                    segments={[
                      { value: revenueByStatus.collected, color: REVENUE_HEX.collected, label: t("analytics.collected") },
                      { value: revenueByStatus.inTransit, color: REVENUE_HEX.inTransit, label: t("analytics.inTransit") },
                      { value: revenueByStatus.pending, color: REVENUE_HEX.pending, label: t("analytics.pendingRevenue") },
                      { value: revenueByStatus.lost, color: REVENUE_HEX.lost, label: t("analytics.lostRevenue") },
                    ].filter(s => s.value > 0).sort((a, b) => b.value - a.value)}
                    centerLabel={t("analytics.sales")}
                    centerValue={formatPrice(totalRevenue, currency)}
                  />
                </CardContent>
              </Card>

              {/* Order Status Distribution Donut */}
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t("analytics.statusDistribution")}</p>
                  <DonutChart
                    segments={(["pending", "confirmed", "shipped", "delivered", "returned", "canceled"] as const)
                      .filter(s => statusCounts[s] > 0)
                      .map(s => ({
                        value: statusCounts[s],
                        color: STATUS_HEX[s],
                        label: t(`orders.status${s.charAt(0).toUpperCase() + s.slice(1)}`),
                      }))
                      .sort((a, b) => b.value - a.value)}
                    centerLabel={t("dashboard.orders")}
                    centerValue={totalOrderCount}
                  />
                </CardContent>
              </Card>
            </div>
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
  chartType = "area",
}: {
  title: string
  value: string
  change: number
  data: number[]
  labels: string[]
  isCurrency?: boolean
  isPercent?: boolean
  currency?: string
  chartType?: "area" | "bar"
}) {
  const { t } = useTranslation()
  const isPositive = change >= 0
  const barCount = data.length
  const maxPoints = 30
  let displayData = data
  let displayLabels = labels
  if (barCount > maxPoints) {
    const chunkSize = Math.ceil(barCount / maxPoints)
    displayData = []
    displayLabels = []
    for (let i = 0; i < barCount; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      displayData.push(chunk.reduce((a, b) => a + b, 0) / chunk.length)
      displayLabels.push(labels[i])
    }
  }

  const chartData = displayData.map((val, i) => ({ label: displayLabels[i] || "", value: val }))
  const gradientId = `gradient-${title.replace(/[^a-zA-Z0-9]/g, "-")}`
  const strokeColor = isPositive ? "#10b981" : "#ef4444"
  const fillColor = isPositive ? "#10b981" : "#ef4444"

  const sharedTooltip = (
    <Tooltip
      cursor={chartType === "bar" ? { fill: "var(--color-accent, rgba(0,0,0,0.05))" } : { stroke: "var(--color-border, #e5e7eb)", strokeDasharray: "3 3" }}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null
        const d = payload[0].payload
        return (
          <div className="rounded-lg border bg-background px-2.5 py-1 text-xs shadow-md">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-1.5 font-semibold">{typeof d.value === "number" ? d.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : d.value}</span>
          </div>
        )
      }}
    />
  )

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
        <div className="mt-3" style={{ height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #9ca3af)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #9ca3af)" }} tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={formatAxisValue} />
                {sharedTooltip}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  animationDuration={800}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }} barCategoryGap="15%">
                <defs>
                  <linearGradient id={`${gradientId}-bar`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={fillColor} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #9ca3af)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #9ca3af)" }} tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={formatAxisValue} />
                {sharedTooltip}
                <Bar
                  dataKey="value"
                  fill={`url(#${gradientId}-bar)`}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 180,
}: {
  segments: { value: number; color: string; label: string }[]
  centerLabel: string
  centerValue: string | number
  size?: number
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  const data = segments.map((seg) => ({
    name: seg.label,
    value: seg.value,
    color: seg.color,
    pct: (seg.value / total) * 100,
  }))

  const displayValue = typeof centerValue === "number" ? centerValue.toLocaleString() : centerValue
  const valueLen = displayValue.length
  const valueSizeClass = valueLen > 14 ? "text-[10px]" : valueLen > 10 ? "text-xs" : valueLen > 6 ? "text-sm" : "text-lg"

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size / 2 - 32}
              outerRadius={size / 2 - 4}
              paddingAngle={3}
              cornerRadius={6}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background px-3 py-1.5 text-sm shadow-md">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground ml-2">{d.value} ({d.pct.toFixed(1)}%)</span>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 pointer-events-none">
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
          <span className={`${valueSizeClass} font-bold tabular-nums text-center leading-tight`}>{displayValue}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm flex-1">{d.name}</span>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums shrink-0">{d.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const MARKET_COLORS = ["#3b82f6", "#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#f97316"]

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

  const rows = markets.map((m, i) => {
    const marketOrders = orders.filter((o) => o.market_id === m.id)
    const revenue = marketOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const aov = marketOrders.length > 0 ? revenue / marketOrders.length : 0
    const baseRevenue = marketOrders.reduce((sum, o) => sum + toBaseCurrency(Number(o.total), o.market_id), 0)
    const share = totalRevenueAll > 0 ? (baseRevenue / totalRevenueAll) * 100 : 0
    const color = MARKET_COLORS[i % MARKET_COLORS.length]
    return { market: m, orderCount: marketOrders.length, revenue, aov, share, displayCurrency: m.currency, color }
  })

  // Include "No market" orders
  const noMarketOrders = orders.filter((o) => !o.market_id)
  if (noMarketOrders.length > 0) {
    const revenue = noMarketOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const aov = revenue / noMarketOrders.length
    const share = totalRevenueAll > 0 ? (revenue / totalRevenueAll) * 100 : 0
    rows.push({ market: { id: "", name: t("analytics.noMarket"), slug: "", currency, is_default: false, price_adjustment: 0 }, orderCount: noMarketOrders.length, revenue, aov, share, displayCurrency: currency, color: "#9ca3af" })
  }

  rows.sort((a, b) => b.share - a.share)

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">{t("analytics.marketPerformance")}</p>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2.5 text-start text-xs font-medium">{t("analytics.market")}</th>
                  <th className="pb-2.5 text-end text-xs font-medium">{t("dashboard.orders")}</th>
                  <th className="pb-2.5 text-end text-xs font-medium">{t("dashboard.revenue")}</th>
                  <th className="pb-2.5 text-end text-xs font-medium hidden sm:table-cell">{t("analytics.aov")}</th>
                  <th className="pb-2.5 text-end text-xs font-medium w-[140px]">{t("analytics.share")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.market.id || "none"} className="border-b last:border-0 group hover:bg-accent/50 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                        <span className="font-medium truncate">{row.market.name}</span>
                        {row.market.is_default && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{t("analytics.default")}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-end tabular-nums">{row.orderCount}</td>
                    <td className="py-2.5 text-end tabular-nums">{formatPrice(row.revenue, row.displayCurrency)}</td>
                    <td className="py-2.5 text-end tabular-nums hidden sm:table-cell">{formatPrice(row.aov, row.displayCurrency)}</td>
                    <td className="py-2.5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(row.share, 100)}%`, backgroundColor: row.color }} />
                        </div>
                        <span className="tabular-nums font-medium text-xs w-12 text-end">{row.share.toFixed(1)}%</span>
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
