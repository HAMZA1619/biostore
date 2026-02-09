import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { getT } from "@/lib/i18n/storefront"

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ order?: string }>
}) {
  const { slug } = await params
  const { order } = await searchParams

  const supabase = await createClient()
  const { data: store } = await supabase
    .from("stores")
    .select("language, thank_you_message")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  const t = getT(store?.language || "en")
  const message = store?.thank_you_message || t("storefront.defaultThankYou")

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
      <Button asChild style={{ backgroundColor: "var(--store-accent)", color: "var(--store-btn-text)" }}>
        <Link href={`/${slug}`}>{t("storefront.continueShopping")}</Link>
      </Button>
    </div>
  )
}
