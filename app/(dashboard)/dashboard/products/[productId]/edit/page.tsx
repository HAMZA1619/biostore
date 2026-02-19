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

  const [{ data: store }, { data: product }] = await Promise.all([
    supabase.from("stores").select("id, currency").eq("owner_id", user.id).single(),
    supabase.from("products").select("*").eq("id", productId).single(),
  ])

  if (!store) redirect("/dashboard/store")
  if (!product || product.store_id !== store.id) notFound()

  const imageIds: string[] = product.image_urls || []

  const [{ data: imgs }, { data: variants }] = await Promise.all([
    imageIds.length > 0
      ? supabase.from("store_images").select("id, storage_path").in("id", imageIds)
      : Promise.resolve({ data: null }),
    supabase.from("product_variants").select("id, options, price, compare_at_price, sku, stock, is_available").eq("product_id", productId).order("sort_order"),
  ])

  const imgMap = new Map((imgs || []).map((i: { id: string; storage_path: string }) => [i.id, i.storage_path]))
  const images = imageIds.map((id) => ({ id, storage_path: imgMap.get(id) || "" })).filter((i) => i.storage_path)

  return (
    <ProductForm
      storeId={store.id}
      currency={store.currency}
      title="products.editProduct"
      initialData={{ ...product, images, options: product.options || [], status: product.status || "active" }}
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
