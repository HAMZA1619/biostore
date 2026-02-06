import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ProductForm } from "@/components/forms/product-form"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", store.id)
    .single()

  if (!product) notFound()

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, options, price, compare_at_price, sku, stock, is_available")
    .eq("product_id", productId)
    .order("sort_order")

  return (
    <ProductForm
      storeId={store.id}
      currency={store.currency}
      title="Edit Product"
      initialData={{ ...product, options: product.options || [], status: product.status || "active" }}
      initialVariants={(variants || []).map((v) => ({
        id: v.id,
        options: v.options as Record<string, string>,
        price: v.price,
        compare_at_price: v.compare_at_price ?? undefined,
        sku: v.sku || undefined,
        stock: v.stock ?? undefined,
        is_available: v.is_available,
      }))}
    />
  )
}
