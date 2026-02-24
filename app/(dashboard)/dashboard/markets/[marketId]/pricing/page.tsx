import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getImageUrl } from "@/lib/utils"
import { MarketPricingEditor } from "@/components/dashboard/market-pricing-editor"

export default async function MarketPricingPage({
  params,
}: {
  params: Promise<{ marketId: string }>
}) {
  const { marketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: market } = await supabase
    .from("markets")
    .select("id, name, currency, pricing_mode")
    .eq("id", marketId)
    .eq("store_id", store.id)
    .single()

  if (!market) notFound()
  if (market.pricing_mode !== "fixed") redirect("/dashboard/markets")

  // Fetch all active products with their variants
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, compare_at_price, image_urls")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const productIds = (products || []).map((p) => p.id)

  // Fetch variants and market prices in parallel
  const [{ data: allVariants }, { data: marketPrices }, { data: imgs }] = await Promise.all([
    productIds.length > 0
      ? supabase.from("product_variants").select("id, product_id, options, price, compare_at_price, sort_order").in("product_id", productIds).order("sort_order")
      : Promise.resolve({ data: null }),
    supabase.from("market_prices").select("product_id, variant_id, price, compare_at_price").eq("market_id", marketId),
    (() => {
      const imageIds = (products || []).flatMap((p) => (p.image_urls || []).slice(0, 1))
      return imageIds.length > 0
        ? supabase.from("store_images").select("id, storage_path").in("id", imageIds)
        : Promise.resolve({ data: null })
    })(),
  ])

  // Build image map
  const imgMap = new Map((imgs || []).map((i: { id: string; storage_path: string }) => [i.id, i.storage_path]))

  // Build products with variants and first image
  const productsWithVariants = (products || []).map((p) => {
    const firstImageId = (p.image_urls || [])[0]
    const storagePath = firstImageId ? imgMap.get(firstImageId) : null
    const variants = (allVariants || [])
      .filter((v) => v.product_id === p.id)
      .map((v) => ({
        id: v.id as string,
        options: v.options as Record<string, string>,
        price: v.price as number,
        compare_at_price: v.compare_at_price as number | null,
      }))

    return {
      id: p.id as string,
      name: p.name as string,
      price: p.price as number,
      compare_at_price: p.compare_at_price as number | null,
      image_url: getImageUrl(storagePath || null),
      variants,
    }
  })

  // Build market prices map: keyed by productId or "productId:variantId"
  const priceMap: Record<string, { price: number; compare_at_price: number | null }> = {}
  for (const mp of marketPrices || []) {
    const key = mp.variant_id ? `${mp.product_id}:${mp.variant_id}` : mp.product_id
    priceMap[key] = { price: mp.price, compare_at_price: mp.compare_at_price }
  }

  return (
    <MarketPricingEditor
      marketId={market.id}
      marketName={market.name}
      marketCurrency={market.currency}
      storeCurrency={store.currency}
      products={productsWithVariants}
      initialPrices={priceMap}
    />
  )
}
