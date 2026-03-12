import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/forms/product-form"
import { checkResourceLimit } from "@/lib/check-limit"
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner"

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const limit = await checkResourceLimit(supabase, user.id, store.id, "products")

  if (!limit.allowed) {
    return (
      <UpgradeBanner
        resource="products"
        current={limit.current}
        limit={limit.limit}
      />
    )
  }

  return (
    <>
      {limit.tier === "free" && (
        <UpgradeBanner
          resource="products"
          current={limit.current}
          limit={limit.limit}
          variant="warning"
        />
      )}
      <ProductForm
        storeId={store.id}
        currency={store.currency}
        title="products.addProduct"
      />
    </>
  )
}
