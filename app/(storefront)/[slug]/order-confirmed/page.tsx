import urlJoin from "url-join"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseDesignSettings } from "@/lib/utils"
import Link from "next/link"
import { headers } from "next/headers"
import { getT } from "@/lib/i18n/storefront"
import { getStoreBySlug } from "@/lib/storefront/cache"

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ order?: string }>
}) {
  const { slug } = await params
  const { order } = await searchParams

  const store = await getStoreBySlug(slug, "design_settings")

  const headersList = await headers()
  const isCustomDomain = headersList.get("x-custom-domain") === "true"
  const baseHref = isCustomDomain ? "" : `/${slug}`

  const ds = parseDesignSettings((store?.design_settings || {}) as Record<string, unknown>)
  const t = getT(ds.language)
  const message = ds.thankYouMessage || t("storefront.defaultThankYou")
  const btnStyle: React.CSSProperties = {
    backgroundColor: ds.buttonStyle === "outline" ? "transparent" : "var(--store-accent)",
    color: ds.buttonStyle === "outline" ? "var(--store-accent)" : "var(--store-btn-text)",
    borderRadius: ds.buttonStyle === "pill" ? "9999px" : "var(--store-radius)",
    border: ds.buttonStyle === "outline" ? "2px solid var(--store-accent)" : "none",
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}
      >
        <CheckCircle className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold">{t("storefront.orderConfirmed")}</h1>
      {order && (
        <p className="text-lg opacity-60">{t("storefront.orderNumber", { number: order })}</p>
      )}
      <p className="max-w-sm opacity-60">{message}</p>
      <Button asChild style={btnStyle}>
        <Link href={urlJoin(baseHref, "/")}>{t("storefront.continueShopping")}</Link>
      </Button>
    </div>
  )
}
