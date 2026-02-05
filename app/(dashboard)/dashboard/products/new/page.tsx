import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/forms/product-form"

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name")
    .eq("store_id", store.id)
    .order("sort_order")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Add Product</h1>
      <ProductForm storeId={store.id} collections={collections || []} />
    </div>
  )
}
