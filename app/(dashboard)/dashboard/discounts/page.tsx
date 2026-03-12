import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DiscountsTable } from "@/components/dashboard/discounts-table"
import { T } from "@/components/dashboard/translated-text"
import { checkResourceLimit } from "@/lib/check-limit"
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner"

export default async function DiscountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const [{ data: discounts }, limit] = await Promise.all([
    supabase
      .from("discounts")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false }),
    checkResourceLimit(supabase, user.id, store.id, "discounts"),
  ])

  return (
    <div className="space-y-4">
      {limit.tier === "free" && (
        <UpgradeBanner
          resource="discounts"
          current={limit.current}
          limit={limit.limit}
          variant={limit.allowed ? "warning" : "blocked"}
        />
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold"><T k="discounts.title" /></h1>
        {limit.allowed && (
          <Button asChild>
            <Link href="/dashboard/discounts/new">
              <Plus className="me-2 h-4 w-4" />
              <T k="discounts.addDiscount" />
            </Link>
          </Button>
        )}
      </div>

      <DiscountsTable
        initialDiscounts={discounts || []}
        currency={store.currency}
      />
    </div>
  )
}
