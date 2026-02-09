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

  // Resolve image IDs to URLs
  const imageIds: string[] = product.image_urls || []
  let images: { id: string; url: string }[] = []
  if (imageIds.length > 0) {
    const { data: imgs } = await supabase
      .from("store_images")
      .select("id, url")
      .in("id", imageIds)
    const imgMap = new Map((imgs || []).map((i: { id: string; url: string }) => [i.id, i.url]))
    images = imageIds.map((id) => ({ id, url: imgMap.get(id) || "" })).filter((i) => i.url)
  }

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, options, price, compare_at_price, sku, stock, is_available")
    .eq("product_id", productId)
    .order("sort_order")

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
