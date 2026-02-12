"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { formatPriceSymbol } from "@/lib/utils"
import { useStoreCurrency } from "@/lib/hooks/use-store-currency"
import { COUNTRIES } from "@/lib/constants"
import { Check, ChevronsUpDown, ImageIcon, Minus, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useBaseHref } from "@/lib/hooks/use-base-href"
import { usePixel } from "@/lib/hooks/use-pixel"
import { useButtonStyle, getButtonStyleProps } from "@/lib/hooks/use-button-style"
import Script from "next/script"
import "@/lib/i18n"

export default function CartPage() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const currency = useStoreCurrency()
  const baseHref = useBaseHref()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)
  const track = usePixel()
  const buttonStyle = useButtonStyle()
  const router = useRouter()

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_city: "",
    customer_country: "",
    customer_address: "",
    note: "",
  })
  const [loading, setLoading] = useState(false)
  const captchaRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  const renderCaptcha = useCallback(() => {
    const hcaptcha = (window as unknown as { hcaptcha?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string } }).hcaptcha
    if (!hcaptcha || !captchaRef.current || widgetIdRef.current !== null) return
    widgetIdRef.current = hcaptcha.render(captchaRef.current, {
      sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
      size: "invisible",
    })
  }, [])

  const [showFields, setShowFields] = useState({
    email: true,
    country: true,
    city: true,
    note: true,
  })

  useEffect(() => {
    const el = document.querySelector("[data-theme]")
    if (!el) return
    setShowFields({
      email: el.getAttribute("data-show-email") !== "false",
      country: el.getAttribute("data-show-country") !== "false",
      city: el.getAttribute("data-show-city") !== "false",
      note: el.getAttribute("data-show-note") !== "false",
    })
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    track("InitiateCheckout", {
      content_ids: items.map((i) => i.productId),
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value: getTotal(),
      currency: currency.toUpperCase(),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill country from IP address
  useEffect(() => {
    fetch("https://ipapi.co/country_code/")
      .then((res) => res.text())
      .then((code) => {
        const trimmed = code.trim().toUpperCase()
        const match = COUNTRIES.find((c) => c.code === trimmed)
        if (match) {
          setForm((prev) => prev.customer_country ? prev : { ...prev, customer_country: match.name })
        }
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t("storefront.cartEmpty")}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`${baseHref}/`)}
        >
          {t("storefront.continueShopping")}
        </Button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name || !form.customer_phone || !form.customer_address) {
      toast.error(t("storefront.fillRequired"))
      return
    }

    setLoading(true)

    try {
      // Execute invisible hCaptcha — passes silently or shows challenge if risky
      const hcaptcha = (window as unknown as { hcaptcha?: { execute: (id: string, opts: { async: boolean }) => Promise<{ response: string }>, reset: (id: string) => void } }).hcaptcha
      let captchaToken = ""
      if (hcaptcha && widgetIdRef.current !== null) {
        const { response } = await hcaptcha.execute(widgetIdRef.current, { async: true })
        captchaToken = response
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          ...form,
          captcha_token: captchaToken,
          payment_method: "cod",
          items: items.map((i) => ({
            product_id: i.productId,
            variant_id: i.variantId || null,
            quantity: i.quantity,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || t("storefront.failedPlaceOrder"))
        if (hcaptcha && widgetIdRef.current !== null) hcaptcha.reset(widgetIdRef.current)
        setLoading(false)
        return
      }

      const data = await res.json()
      clearCart()
      router.push(`${baseHref}/order-confirmed?order=${data.order_number}`)
    } catch {
      toast.error(t("storefront.failedPlaceOrder"))
      const hcaptcha = (window as unknown as { hcaptcha?: { reset: (id: string) => void } }).hcaptcha
      if (hcaptcha && widgetIdRef.current !== null) hcaptcha.reset(widgetIdRef.current)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">{t("storefront.yourCart")}</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.variantId ? `${item.productId}:${item.variantId}` : item.productId} className="store-card flex gap-3 p-3" style={{ borderRadius: "var(--store-radius)" }}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/40">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="line-clamp-2 font-medium leading-tight">{item.name}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 rounded-full bg-red-100 hover:bg-red-200"
                  onClick={() => removeItem(item.productId, item.variantId)}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {formatPriceSymbol(item.price, currency)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-lg font-bold">
        <span>{t("storefront.total")}</span>
        <span>{formatPriceSymbol(getTotal(), currency)}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-bold">{t("storefront.deliveryInformation")}</h2>

        <div className="space-y-2">
          <Label htmlFor="name">{t("storefront.fullName")}</Label>
          <Input
            id="name"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            placeholder={t("storefront.fullNamePlaceholder")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("storefront.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            placeholder={t("storefront.phonePlaceholder")}
            required
          />
        </div>

        {showFields.email && (
          <div className="space-y-2">
            <Label htmlFor="email">{t("storefront.email")}</Label>
            <Input
              id="email"
              type="email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              placeholder={t("storefront.emailPlaceholder")}
              required
            />
          </div>
        )}

        {showFields.country && (
          <div className="space-y-2">
            <Label>{t("storefront.country")}</Label>
            <CountryCombobox
              value={form.customer_country}
              onChange={(v) => setForm({ ...form, customer_country: v })}
            />
          </div>
        )}

        {showFields.city && (
          <div className="space-y-2">
            <Label htmlFor="city">{t("storefront.city")}</Label>
            <Input
              id="city"
              value={form.customer_city}
              onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
              placeholder={t("storefront.cityPlaceholder")}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="address">{t("storefront.address")}</Label>
          <Textarea
            id="address"
            value={form.customer_address}
            onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
            placeholder={t("storefront.addressPlaceholder")}
            rows={2}
            required
          />
        </div>

        {showFields.note && (
          <div className="space-y-2">
            <Label htmlFor="note">{t("storefront.note")}</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder={t("storefront.notePlaceholder")}
              rows={2}
              required
            />
          </div>
        )}

        <Script
          src="https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off"
          strategy="afterInteractive"
          onReady={renderCaptcha}
        />
        <div ref={captchaRef} />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading}
          style={getButtonStyleProps(buttonStyle)}
        >
          {loading ? t("storefront.placingOrder") : t("storefront.orderNow")}
        </Button>
      </form>
    </div>
  )
}

function CountryCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const displayNames = useMemo(
    () => new Intl.DisplayNames([i18n.language], { type: "region" }),
    [i18n.language]
  )

  const getLocalName = (code: string) => {
    try { return displayNames.of(code) || code } catch { return code }
  }

  const selectedCountry = COUNTRIES.find((c) => c.name === value)
  const displayValue = selectedCountry ? getLocalName(selectedCountry.code) : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue || t("storefront.selectCountry")}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={t("storefront.searchCountry")} />
          <CommandList>
            <CommandEmpty>{t("storefront.noCountryFound")}</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => {
                const localName = getLocalName(country.code)
                return (
                  <CommandItem
                    key={country.code}
                    value={localName}
                    onSelect={() => {
                      onChange(country.name)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "me-2 h-4 w-4",
                        value === country.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {localName}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
