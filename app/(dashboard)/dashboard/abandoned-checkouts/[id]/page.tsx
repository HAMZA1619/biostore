import urlJoin from "url-join"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { formatPrice, getImageUrl } from "@/lib/utils"
import { ArrowLeft, ImageIcon, ChevronRight, Phone, Mail, LinkIcon, Clock } from "lucide-react"
import { T } from "@/components/dashboard/translated-text"
import { CopyButton } from "@/components/dashboard/copy-button"
import { FormattedDate, FormattedDateTime } from "@/components/dashboard/formatted-date"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  recovered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
}

export default async function AbandonedCheckoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, custom_domain, domain_verified")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: checkout } = await supabase
    .from("abandoned_checkouts")
    .select("*")
    .eq("id", id)
    .eq("store_id", store.id)
    .single()

  if (!checkout) notFound()

  const rawItems = (checkout.cart_items as { product_id?: string; product_name: string; product_price: number; quantity: number; variant_options?: string | null; image_url?: string | null }[]) || []

  // Always resolve fresh images from products for all items
  const productIds = [...new Set(rawItems.filter((i) => i.product_id).map((i) => i.product_id!))]
  const imageMap = new Map<string, string>()

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, image_urls")
      .in("id", productIds)

    const allImageIds = (products || []).flatMap((p) => (p.image_urls as string[]) || []).slice(0, 50)
    if (allImageIds.length > 0) {
      const { data: imgs } = await supabase
        .from("store_images")
        .select("id, storage_path")
        .in("id", allImageIds)

      const imgLookup = new Map((imgs || []).map((i) => [i.id, i.storage_path]))
      for (const p of products || []) {
        const firstId = ((p.image_urls as string[]) || [])[0]
        const path = firstId ? imgLookup.get(firstId) : undefined
        if (path) imageMap.set(p.id, getImageUrl(path)!)
      }
    }
  }

  const items = rawItems.map((i) => ({
    ...i,
    image_url: (i.product_id ? imageMap.get(i.product_id) : null) || i.image_url || null,
  }))
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const initials = (checkout.customer_name || checkout.customer_phone)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const storeUrl =
    store.custom_domain && store.domain_verified
      ? `https://${store.custom_domain}`
      : urlJoin(process.env.NEXT_PUBLIC_APP_URL!, store.slug)
  const recoveryLink = urlJoin(storeUrl, "cart") + `?checkout=${checkout.id}`

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/abandoned-checkouts" className="hover:text-foreground">
          <T k="abandonedCheckouts.title" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-foreground font-medium truncate">
          {checkout.customer_name || checkout.customer_phone}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/abandoned-checkouts" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold truncate">
            {checkout.customer_name || checkout.customer_phone}
          </h1>
          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[checkout.status] || ""}`}>
            {checkout.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground"><FormattedDateTime date={checkout.created_at} /></p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Cart items */}
          <div>
            <h2 className="text-sm font-semibold mb-3"><T k="abandonedCheckouts.cartItems" /></h2>
            <div className="divide-y">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-4 py-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-14 w-14 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground/40">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {item.product_name}
                    </p>
                    {item.variant_options && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.variant_options}
                      </p>
                    )}
                  </div>
                  <div className="text-end shrink-0 text-sm">
                    <span className="text-muted-foreground">
                      {formatPrice(item.product_price, checkout.currency)} × {item.quantity}
                    </span>
                    <p className="font-medium mt-0.5">
                      {formatPrice(item.product_price * item.quantity, checkout.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pricing summary */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                <T k="orderDetail.subtotal" />{" "}
                <span className="text-primary">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              </span>
              <span>{formatPrice(checkout.subtotal || checkout.total, checkout.currency)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-semibold pt-1">
              <span><T k="orderDetail.total" /></span>
              <span>{formatPrice(checkout.total, checkout.currency)}</span>
            </div>
          </div>

          <Separator />

          {/* Recovery link */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold"><T k="abandonedCheckouts.recoveryLink" /></h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              <T k="abandonedCheckouts.recoveryLinkHint" />
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded-md border bg-muted px-3 py-2 text-xs">
                {recoveryLink}
              </code>
              <CopyButton text={recoveryLink} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {checkout.customer_name || checkout.customer_phone}
              </p>
              {checkout.customer_country && (
                <p className="text-xs text-muted-foreground">
                  {checkout.customer_country}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold mb-3"><T k="abandonedCheckouts.contactInfo" /></h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span dir="ltr">{checkout.customer_phone}</span>
              </div>
              {checkout.customer_email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{checkout.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {(checkout.customer_address || checkout.customer_city || checkout.customer_country) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3"><T k="abandonedCheckouts.shippingAddress" /></h3>
                <div className="space-y-1 text-sm">
                  {checkout.customer_address && (
                    <p className="text-muted-foreground">{checkout.customer_address}</p>
                  )}
                  {checkout.customer_city && (
                    <p className="text-muted-foreground">{checkout.customer_city}</p>
                  )}
                  {checkout.customer_country && (
                    <p className="text-muted-foreground">{checkout.customer_country}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <T k="abandonedCheckouts.timeline" />
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground"><T k="abandonedCheckouts.createdAt" /></span>
                <span><FormattedDate date={checkout.created_at} /></span>
              </div>
              {checkout.sent_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground"><T k="abandonedCheckouts.sentAt" /></span>
                  <span><FormattedDate date={checkout.sent_at} /></span>
                </div>
              )}
              {checkout.recovered_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground"><T k="abandonedCheckouts.recoveredAt" /></span>
                  <span><FormattedDate date={checkout.recovered_at} /></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
