import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MarketForm } from "@/components/forms/market-form"

export default async function EditMarketPage({
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
    .select("*")
    .eq("id", marketId)
    .eq("store_id", store.id)
    .single()

  if (!market) notFound()

  return (
    <div className="space-y-6">
      <MarketForm
        storeId={store.id}
        initialData={{
          id: market.id,
          name: market.name,
          slug: market.slug,
          countries: market.countries,
          currency: market.currency,
          pricing_mode: market.pricing_mode,
          price_adjustment: Number(market.price_adjustment),
          is_default: market.is_default,
          is_active: market.is_active,
        }}
      />
    </div>
  )
}
