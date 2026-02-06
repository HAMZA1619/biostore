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
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>()
  const currency = useStoreCurrency()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)
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

  // Pre-fill country from IP address
  useEffect(() => {
    fetch("https://ipapi.co/country_name/")
      .then((res) => res.text())
      .then((name) => {
        const trimmed = name.trim()
        if (COUNTRIES.includes(trimmed as typeof COUNTRIES[number])) {
          setForm((prev) => prev.customer_country ? prev : { ...prev, customer_country: trimmed })
        }
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Your cart is empty</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${slug}`)}
        >
          Continue shopping
        </Button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name || !form.customer_phone || !form.customer_address) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        ...form,
        payment_method: "cod",
        items: items.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId || null,
          quantity: i.quantity,
        })),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Order failed:", data)
      toast.error(data.error + (data.debug ? ` — ${JSON.stringify(data.debug)}` : ""))
      setLoading(false)
      return
    }

    clearCart()
    router.push(`/${slug}/order-confirmed?order=${data.order_number}`)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Your Cart</h1>

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
        <span>Total</span>
        <span>{formatPriceSymbol(getTotal(), currency)}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-bold">Delivery Information</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            placeholder="06XX XXX XXX"
            required
          />
        </div>

        {showFields.email && (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
        )}

        {showFields.country && (
          <div className="space-y-2">
            <Label>Country</Label>
            <CountryCombobox
              value={form.customer_country}
              onChange={(v) => setForm({ ...form, customer_country: v })}
            />
          </div>
        )}

        {showFields.city && (
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.customer_city}
              onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
              placeholder="Your city"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={form.customer_address}
            onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
            placeholder="Full delivery address"
            rows={2}
            required
          />
        </div>

        {showFields.note && (
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Any special instructions..."
              rows={2}
              required
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading}
          style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}
        >
          {loading ? "Placing order..." : "Order now"}
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
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Select country"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={() => {
                    onChange(country)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
