import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getImageUrl } from "@/lib/utils"
import { MarketExclusionsEditor } from "@/components/dashboard/market-exclusions-editor"

export default async function MarketExclusionsPage({
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
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: market } = await supabase
    .from("markets")
    .select("id, name")
    .eq("id", marketId)
    .eq("store_id", store.id)
    .single()

  if (!market) notFound()

  // Fetch all active products and current exclusions in parallel
  const [{ data: products }, { data: exclusions }, { data: imgs }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, image_urls")
      .eq("store_id", store.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("market_exclusions")
      .select("product_id")
      .eq("market_id", marketId),
    (() => {
      // We'll resolve images after we have the product list
      return supabase
        .from("products")
        .select("id, image_urls")
        .eq("store_id", store.id)
        .eq("status", "active")
        .then(({ data }) => {
          const imageIds = (data || []).flatMap((p) => ((p.image_urls as string[]) || []).slice(0, 1))
          return imageIds.length > 0
            ? supabase.from("store_images").select("id, storage_path").in("id", imageIds)
            : Promise.resolve({ data: null })
        })
    })(),
  ])

  // Build image map
  const imgMap = new Map((imgs || []).map((i: { id: string; storage_path: string }) => [i.id, i.storage_path]))

  const productsWithImages = (products || []).map((p) => {
    const firstImageId = ((p.image_urls as string[]) || [])[0]
    const storagePath = firstImageId ? imgMap.get(firstImageId) : null
    return {
      id: p.id as string,
      name: p.name as string,
      image_url: getImageUrl(storagePath || null),
    }
  })

  return (
    <MarketExclusionsEditor
      marketId={market.id}
      marketName={market.name}
      products={productsWithImages}
      initialExclusions={(exclusions || []).map((e) => e.product_id)}
    />
  )
}
