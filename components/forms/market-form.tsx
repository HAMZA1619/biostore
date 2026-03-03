"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import Link from "next/link"
import { ArrowLeft, Check, ChevronsUpDown, Loader2, RefreshCw, X } from "lucide-react"
import { cn, slugify } from "@/lib/utils"
import { COUNTRIES, CURRENCIES } from "@/lib/constants"
import { marketSchema, type MarketFormData } from "@/lib/validations/market"
import "@/lib/i18n"

interface MarketFormProps {
  storeId: string
  storeCurrency: string
  initialData?: {
    id: string
    name: string
    slug: string
    countries: string[]
    currency: string
    pricing_mode: string
    price_adjustment: number
    rounding_rule: string
    manual_exchange_rate: number | null
    is_default: boolean
    is_active: boolean
  }
}

export function MarketForm({ storeId, storeCurrency, initialData }: MarketFormProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const isEdit = !!initialData

  const countryName = useMemo(() => {
    const dn = new Intl.DisplayNames([i18n.language], { type: "region" })
    return (code: string) => dn.of(code) || code
  }, [i18n.language])

  const currencyDisplayName = useMemo(() => {
    const dn = new Intl.DisplayNames([i18n.language], { type: "currency" })
    return (code: string) => dn.of(code) || code
  }, [i18n.language])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      countries: initialData?.countries || [],
      currency: initialData?.currency || "",
      pricing_mode: (initialData?.pricing_mode as "fixed" | "auto") || "auto",
      price_adjustment: initialData?.price_adjustment || 0,
      rounding_rule: (initialData?.rounding_rule as "none" | "0.99" | "0.95" | "0.00" | "nearest_5") || "none",
      manual_exchange_rate: initialData?.manual_exchange_rate ?? null,
      is_default: initialData?.is_default || false,
      is_active: initialData?.is_active !== false,
    },
  })

  const [loading, setLoading] = useState(false)
  const [countriesOpen, setCountriesOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [useManualRate, setUseManualRate] = useState(initialData?.manual_exchange_rate != null)
  const [autoRate, setAutoRate] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(false)

  const watchCountries = watch("countries")
  const watchCurrency = watch("currency")
  const watchPricingMode = watch("pricing_mode")
  const watchRoundingRule = watch("rounding_rule")
  const watchIsDefault = watch("is_default")
  const watchIsActive = watch("is_active")

  // Fetch live auto rate when currency changes
  useEffect(() => {
    if (!watchCurrency || watchCurrency === storeCurrency) {
      setAutoRate(null)
      return
    }
    let cancelled = false
    setRateLoading(true)
    fetch(`/api/markets/exchange-rate?from=${storeCurrency}&to=${watchCurrency}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.rate) setAutoRate(data.rate)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRateLoading(false) })
    return () => { cancelled = true }
  }, [watchCurrency, storeCurrency])

  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (!isEdit && !watch("slug")) {
      setValue("slug", slugify(e.target.value).slice(0, 10))
    }
  }

  function toggleCountry(code: string) {
    const current = watchCountries || []
    if (current.includes(code)) {
      setValue("countries", current.filter((c) => c !== code))
    } else {
      setValue("countries", [...current, code])
    }
  }

  function removeCountry(code: string) {
    setValue("countries", (watchCountries || []).filter((c) => c !== code))
  }

  async function onSubmit(data: MarketFormData) {
    setLoading(true)
    try {
      const url = "/api/markets"
      const method = isEdit ? "PATCH" : "POST"
      const body = isEdit
        ? { id: initialData!.id, ...data }
        : { store_id: storeId, ...data }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || t("markets.saveFailed"))
        return
      }

      toast.success(isEdit ? t("markets.marketUpdated") : t("markets.marketCreated"))
      router.push("/dashboard/markets")
      router.refresh()
    } catch {
      toast.error(t("markets.saveFailed"))
    } finally {
      setLoading(false)
    }
  }

  const selectedCurrencyObj = CURRENCIES.find((c) => c.code === watchCurrency)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-1 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">
            {isEdit ? t("markets.editTitle") : t("markets.newTitle")}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            {t("markets.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEdit ? t("markets.updateMarket") : t("markets.createMarket")}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>{t("markets.name")}</Label>
          <Input
            {...register("name")}
            placeholder={t("markets.namePlaceholder")}
            onBlur={handleNameBlur}
          />
          {errors.name && <p className="text-sm text-red-600">{t(errors.name.message!)}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t("markets.slug")}</Label>
          <Input
            {...register("slug")}
            placeholder="ma"
            disabled={isEdit}
          />
          <p className="text-xs text-muted-foreground">
            {isEdit ? t("markets.slugLockedHint") : t("markets.slugHint")}
          </p>
          {errors.slug && <p className="text-sm text-red-600">{t(errors.slug.message!)}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t("markets.countries")}</Label>
          <Popover open={countriesOpen} onOpenChange={setCountriesOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {watchCountries?.length
                  ? `${watchCountries.length} ${t("markets.countriesSelected")}`
                  : t("markets.selectCountries")}
                <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder={t("markets.searchCountries")} />
                <CommandList>
                  <CommandEmpty>{t("markets.noCountryFound")}</CommandEmpty>
                  <CommandGroup>
                    {COUNTRIES.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={`${countryName(country.code)} ${country.name}`}
                        onSelect={() => toggleCountry(country.code)}
                      >
                        <Check className={cn("me-2 h-4 w-4", watchCountries?.includes(country.code) ? "opacity-100" : "opacity-0")} />
                        {countryName(country.code)} ({country.code})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {watchCountries?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {watchCountries.map((code) => (
                <span key={code} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                  {countryName(code)}
                  <button type="button" onClick={() => removeCountry(code)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.countries && <p className="text-sm text-red-600">{t(errors.countries.message!)}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t("markets.currency")}</Label>
          <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {selectedCurrencyObj ? `${selectedCurrencyObj.symbol} ${selectedCurrencyObj.code} — ${currencyDisplayName(selectedCurrencyObj.code)}` : t("markets.selectCurrency")}
                <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder={t("markets.searchCurrency")} />
                <CommandList>
                  <CommandEmpty>{t("markets.noCurrencyFound")}</CommandEmpty>
                  <CommandGroup>
                    {CURRENCIES.map((curr) => (
                      <CommandItem
                        key={curr.code}
                        value={`${curr.code} ${currencyDisplayName(curr.code)} ${curr.name}`}
                        onSelect={() => { setValue("currency", curr.code); setCurrencyOpen(false) }}
                      >
                        <Check className={cn("me-2 h-4 w-4", watchCurrency === curr.code ? "opacity-100" : "opacity-0")} />
                        {curr.symbol} {curr.code} — {currencyDisplayName(curr.code)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.currency && <p className="text-sm text-red-600">{t(errors.currency.message!)}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t("markets.pricingMode")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <label className={cn(
              "cursor-pointer rounded-lg border p-3 text-sm transition-colors",
              watchPricingMode === "auto" && "border-primary bg-primary/5 ring-1 ring-primary"
            )}>
              <input type="radio" value="auto" {...register("pricing_mode")} className="sr-only" />
              <span className="font-medium">{t("markets.auto")}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("markets.autoDesc")}</p>
            </label>
            <label className={cn(
              "cursor-pointer rounded-lg border p-3 text-sm transition-colors",
              watchPricingMode === "fixed" && "border-primary bg-primary/5 ring-1 ring-primary"
            )}>
              <input type="radio" value="fixed" {...register("pricing_mode")} className="sr-only" />
              <span className="font-medium">{t("markets.fixed")}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("markets.fixedDesc")}</p>
            </label>
          </div>
        </div>

        {watchPricingMode === "auto" && (
          <>
            <div className="space-y-2">
              <Label>{t("markets.priceAdjustment")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  {...register("price_adjustment", { valueAsNumber: true })}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("markets.priceAdjustmentHelp")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("markets.roundingRule")}</Label>
              <Select
                value={watchRoundingRule || "none"}
                onValueChange={(v) => setValue("rounding_rule", v as "none" | "0.99" | "0.95" | "0.00" | "nearest_5")}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("markets.roundingNone")}</SelectItem>
                  <SelectItem value="0.99">{t("markets.rounding099")}</SelectItem>
                  <SelectItem value="0.95">{t("markets.rounding095")}</SelectItem>
                  <SelectItem value="0.00">{t("markets.rounding000")}</SelectItem>
                  <SelectItem value="nearest_5">{t("markets.roundingNearest5")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("markets.roundingRuleHelp")}</p>
            </div>

            {watchCurrency && watchCurrency !== storeCurrency && (
              <div className="space-y-3">
                <Label>{t("markets.exchangeRate")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={cn(
                    "cursor-pointer rounded-lg border p-3 text-sm transition-colors",
                    !useManualRate && "border-primary bg-primary/5 ring-1 ring-primary"
                  )}>
                    <input
                      type="radio"
                      checked={!useManualRate}
                      onChange={() => {
                        setUseManualRate(false)
                        setValue("manual_exchange_rate", null)
                      }}
                      className="sr-only"
                    />
                    <span className="font-medium">{t("markets.autoRate")}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("markets.autoRateDesc")}</p>
                  </label>
                  <label className={cn(
                    "cursor-pointer rounded-lg border p-3 text-sm transition-colors",
                    useManualRate && "border-primary bg-primary/5 ring-1 ring-primary"
                  )}>
                    <input
                      type="radio"
                      checked={useManualRate}
                      onChange={() => {
                        setUseManualRate(true)
                        setValue("manual_exchange_rate", autoRate || 1)
                      }}
                      className="sr-only"
                    />
                    <span className="font-medium">{t("markets.manualRate")}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("markets.manualRateDesc")}</p>
                  </label>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  {rateLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("markets.fetchingRate")}
                    </div>
                  ) : autoRate ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{t("markets.currentAutoRate")}:</span>{" "}
                        <span className="font-medium tabular-nums">1 {storeCurrency} = {autoRate.toFixed(4)} {watchCurrency}</span>
                      </p>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          setRateLoading(true)
                          fetch(`/api/markets/exchange-rate?from=${storeCurrency}&to=${watchCurrency}`)
                            .then((res) => res.json())
                            .then((data) => { if (data.rate) setAutoRate(data.rate) })
                            .catch(() => {})
                            .finally(() => setRateLoading(false))
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}

                  {useManualRate && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">1 {storeCurrency} =</span>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        {...register("manual_exchange_rate", { valueAsNumber: true })}
                        className="w-36"
                      />
                      <span className="text-sm text-muted-foreground">{watchCurrency}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {useManualRate ? t("markets.manualRateHelp") : t("markets.autoRateDesc")}
                </p>
              </div>
            )}
          </>
        )}

        {watchPricingMode === "fixed" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("markets.fixedPricingNote")}</p>
            {isEdit && initialData?.id && (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/dashboard/markets/${initialData.id}/pricing`}>
                  {t("markets.goToPricing")}
                </Link>
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>{t("markets.isDefault")}</Label>
            <p className="text-xs text-muted-foreground">{t("markets.defaultMarketNote")}</p>
          </div>
          <Switch
            checked={watchIsDefault}
            onCheckedChange={(v) => setValue("is_default", v)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>{t("markets.isActive")}</Label>
            <p className="text-xs text-muted-foreground">{t("markets.activeMarketNote")}</p>
          </div>
          <Switch
            checked={watchIsActive}
            onCheckedChange={(v) => setValue("is_active", v)}
          />
        </div>
      </div>
    </form>
  )
}
