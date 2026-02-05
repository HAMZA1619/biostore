"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MOROCCAN_CITIES } from "@/lib/constants"
import { formatPrice } from "@/lib/utils"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)
  const router = useRouter()

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_city: "",
    customer_address: "",
    payment_method: "cod",
    note: "",
  })
  const [loading, setLoading] = useState(false)

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
    if (!form.customer_name || !form.customer_phone || !form.customer_city || !form.customer_address) {
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
        items: items.map((i) => ({
          product_id: i.productId,
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

    // Build WhatsApp message with order details
    const itemsList = data.items
      .map((i: { product_name: string; quantity: number; product_price: number }) =>
        `- ${i.product_name} x${i.quantity} = ${i.product_price * i.quantity} MAD`
      )
      .join("\n")

    const paymentLabel = form.payment_method === "cod" ? "Cash on delivery" : "Bank transfer"

    const message =
      `*New Order #${data.order_number}*\n` +
      `From: ${data.store_name}\n\n` +
      `*Customer:*\n` +
      `Name: ${form.customer_name}\n` +
      `Phone: ${form.customer_phone}\n` +
      `City: ${form.customer_city}\n` +
      `Address: ${form.customer_address}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `*Total: ${data.total} MAD*\n` +
      `Payment: ${paymentLabel}` +
      (form.note ? `\nNote: ${form.note}` : "")

    // Open WhatsApp with the store owner's number
    const phone = (data.store_phone || "").replace(/\s+/g, "").replace(/^\+/, "")
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    clearCart()
    window.open(whatsappUrl, "_blank")
    router.push(`/${slug}/order-confirmed?order=${data.order_number}`)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Your Cart</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 rounded-lg border p-3">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                className="h-16 w-16 rounded-md object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(item.price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{formatPrice(getTotal())}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-bold">Delivery Information</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Full name *</Label>
          <Input
            id="name"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number *</Label>
          <Input
            id="phone"
            type="tel"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            placeholder="06XX XXX XXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>City *</Label>
          <Select
            value={form.customer_city}
            onValueChange={(v) => setForm({ ...form, customer_city: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {MOROCCAN_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            value={form.customer_address}
            onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
            placeholder="Full delivery address"
            rows={2}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Any special instructions..."
            rows={2}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading}
          style={{ backgroundColor: "var(--store-accent)" }}
        >
          {loading ? "Placing order..." : `Order via WhatsApp - ${formatPrice(getTotal())}`}
        </Button>
      </form>
    </div>
  )
}
