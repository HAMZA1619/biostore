"use client"

import urlJoin from "url-join"
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
import { Check, ChevronsUpDown, ImageIcon, Loader2, Minus, Plus, Tag, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useBaseHref } from "@/lib/hooks/use-base-href"
import { usePixel } from "@/lib/hooks/use-pixel"
import { useTiktokPixel } from "@/lib/hooks/use-tiktok-pixel"
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
  const appliedDiscount = useCartStore((s) => s.appliedDiscount)
  const setDiscount = useCartStore((s) => s.setDiscount)
  const getDiscountedTotal = useCartStore((s) => s.getDiscountedTotal)
  const track = usePixel()
  const ttTrack = useTiktokPixel()
  const buttonStyle = useButtonStyle()
  const router = useRouter()
  const [couponCode, setCouponCode] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [hasDiscounts, setHasDiscounts] = useState(false)

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_city: "",
    customer_country: "",
    customer_address: "",
    note: "",
  })

  const searchParams = useSearchParams()
  const recoverId = searchParams.get("checkout")

  useEffect(() => {
    if (!recoverId) return
    fetch(`/api/recover/${recoverId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        useCartStore.setState({
          items: (data.cart_items || []).map((item: { product_id?: string; variant_id?: string | null; product_name: string; product_price: number; quantity: number; variant_options?: string | null; image_url?: string | null }) => ({
            productId: item.product_id || item.product_name,
            variantId: item.variant_id || null,
            name: item.product_name,
            variantLabel: item.variant_options || null,
            price: item.product_price,
            quantity: item.quantity,
            imageUrl: item.image_url || null,
          })),
          storeSlug: slug,
          appliedDiscount: null,
        })
        setForm((prev) => ({
          ...prev,
          customer_name: data.customer_name || prev.customer_name,
          customer_phone: data.customer_phone || prev.customer_phone,
          customer_email: data.customer_email || prev.customer_email,
          customer_country: data.customer_country || prev.customer_country,
          customer_city: data.customer_city || prev.customer_city,
          customer_address: data.customer_address || prev.customer_address,
        }))
      })
      .catch(() => {})
  }, [recoverId, slug])

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

  const checkoutSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phoneEnteredRef = useRef(false)

  const saveCheckoutSession = useCallback(() => {
    if (!form.customer_phone || items.length === 0) return
    phoneEnteredRef.current = true

    const cartItems = items.map((i) => ({
      product_id: i.productId,
      variant_id: i.variantId || null,
      product_name: i.name,
      product_price: i.price,
      quantity: i.quantity,
      variant_options: i.variantLabel || null,
      image_url: i.imageUrl || null,
    }))

    fetch("/api/checkout-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        customer_phone: form.customer_phone,
        customer_name: form.customer_name || undefined,
        customer_email: form.customer_email || undefined,
        customer_city: form.customer_city || undefined,
        customer_country: form.customer_country || undefined,
        customer_address: form.customer_address || undefined,
        cart_items: cartItems,
        subtotal: getTotal(),
        total: getDiscountedTotal(),
      }),
    }).catch(() => {})
  }, [slug, form, items, getTotal, getDiscountedTotal])

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
    ttTrack("InitiateCheckout", {
      content_ids: items.map((i) => i.productId),
      value: getTotal(),
      currency: currency.toUpperCase(),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Check if store has active discounts
  useEffect(() => {
    fetch(`/api/discounts/validate?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => setHasDiscounts(d.has_discounts))
      .catch(() => {})
  }, [slug])

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

  // Debounced re-save checkout session when form/cart changes
  useEffect(() => {
    if (!phoneEnteredRef.current || !form.customer_phone || items.length === 0) return
    if (checkoutSaveRef.current) clearTimeout(checkoutSaveRef.current)
    checkoutSaveRef.current = setTimeout(() => {
      saveCheckoutSession()
    }, 5000)
    return () => {
      if (checkoutSaveRef.current) clearTimeout(checkoutSaveRef.current)
    }
  }, [form, items, saveCheckoutSession])

  // Check for automatic discounts and re-validate applied discounts on cart changes
  const subtotal = getTotal()
  useEffect(() => {
    if (items.length === 0) {
      setDiscount(null)
      return
    }

    if (appliedDiscount) {
      // Re-calculate discount amount for percentage discounts
      if (appliedDiscount.discountType === "percentage") {
        const newAmount = Math.round(subtotal * appliedDiscount.discountValue / 100 * 100) / 100
        if (newAmount !== appliedDiscount.discountAmount) {
          setDiscount({ ...appliedDiscount, discountAmount: Math.min(newAmount, subtotal) })
        }
      }
      // If it's a coupon code, re-validate
      if (appliedDiscount.code) {
        fetch("/api/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, code: appliedDiscount.code, subtotal }),
        })
          .then((r) => r.json())
          .then((d) => { if (!d.valid) setDiscount(null) })
          .catch(() => {})
      }
    }
  }, [subtotal]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApplyCoupon() {
    if (!couponCode.trim() || couponLoading) return
    setCouponLoading(true)
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          code: couponCode.trim(),
          subtotal: getTotal(),
          customer_phone: form.customer_phone || undefined,
        }),
      })
      const data = await res.json()
      if (data.valid) {
        setDiscount({
          discountId: data.discount_id,
          code: couponCode.trim().toUpperCase(),
          label: data.label,
          discountType: data.discount_type,
          discountValue: data.discount_value,
          discountAmount: data.discount_amount,
        })
        setCouponCode("")
        toast.success(t("storefront.couponApplied"))
      } else {
        toast.error(t("storefront.invalidCoupon"))
      }
    } catch {
      toast.error(t("storefront.invalidCoupon"))
    } finally {
      setCouponLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t("storefront.cartEmpty")}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(urlJoin(baseHref, "/"))}
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
          discount_code: appliedDiscount?.code || undefined,
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
      router.push(urlJoin(baseHref, "order-confirmed") + `?order=${data.order_number}`)
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
              <Image
                src={item.imageUrl}
                alt=""
                width={64}
                height={64}
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

      {/* Coupon Code Input */}
      {hasDiscounts && !appliedDiscount && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t("storefront.couponPlaceholder")}
              className="ps-9 uppercase"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyCoupon}
            disabled={couponLoading || !couponCode.trim()}
          >
            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("storefront.apply")}
          </Button>
        </div>
      )}

      {/* Applied Discount */}
      {appliedDiscount && (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-900 dark:bg-green-950">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Tag className="h-4 w-4" />
            <span>{appliedDiscount.label}</span>
            <span className="font-medium">
              {appliedDiscount.discountType === "percentage"
                ? `-${appliedDiscount.discountValue}%`
                : `-${formatPriceSymbol(appliedDiscount.discountAmount, currency)}`}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setDiscount(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Order Summary */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t("storefront.subtotal")}</span>
          <span>{formatPriceSymbol(getTotal(), currency)}</span>
        </div>
        {appliedDiscount && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t("storefront.discount")}</span>
            <span>-{formatPriceSymbol(appliedDiscount.discountAmount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>{t("storefront.total")}</span>
          <span>{formatPriceSymbol(getDiscountedTotal(), currency)}</span>
        </div>
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
            onBlur={saveCheckoutSession}
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
