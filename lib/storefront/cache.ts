import { unstable_cache } from "next/cache"
import { createStaticClient } from "@/lib/supabase/static"
import { createAdminClient } from "@/lib/supabase/admin"
import { getImageUrl } from "@/lib/utils"

const REVALIDATE = 300
const IMAGE_REVALIDATE = 600

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export function getStoreBySlug<T extends string>(slug: string, select: T) {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("stores")
        .select(select)
        .eq("slug", slug)
        .eq("is_published", true)
        .single()
      return data
    },
    [`store-${slug}-${select}`],
    { tags: [`store:${slug}`], revalidate: REVALIDATE },
  )()
}

// ---------------------------------------------------------------------------
// Owner subscription check
// ---------------------------------------------------------------------------

export function getStoreOwnerAccess(storeId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data: store } = await supabase
        .from("stores")
        .select("owner_id")
        .eq("id", storeId)
        .single()
      if (!store) return false

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at")
        .eq("id", store.owner_id)
        .single()
      if (!profile) return false

      const s = profile.subscription_status
      if (s === "active" || s === "past_due" || s === "canceled") return true
      if (s === "trialing" && profile.trial_ends_at) {
        return new Date(profile.trial_ends_at).getTime() > Date.now()
      }
      return false
    },
    [`owner-access-${storeId}`],
    { tags: [`store:${storeId}`], revalidate: 60 },
  )()
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export function getStoreCollections(storeId: string) {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug")
        .eq("store_id", storeId)
        .order("sort_order")
      return data
    },
    [`collections-${storeId}`],
    { tags: [`collections:${storeId}`], revalidate: REVALIDATE },
  )()
}

// ---------------------------------------------------------------------------
// Products (paginated list)
// ---------------------------------------------------------------------------

export function getStoreProducts(
  storeId: string,
  page: number,
  pageSize: number,
  collectionId?: string | null,
  search?: string | null,
) {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()

      let query = supabase
        .from("products")
        .select(
          "id, name, price, compare_at_price, image_urls, is_available, stock, options, product_variants(price)",
        )
        .eq("store_id", storeId)
        .eq("status", "active")
        .order("sort_order")
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (collectionId) {
        query = query.eq("collection_id", collectionId)
      }

      if (search) {
        query = query.ilike("name", `%${search}%`)
      }

      const { data } = await query
      return data
    },
    [`products-${storeId}-${page}-${pageSize}-${collectionId ?? ""}-${search ?? ""}`],
    { tags: [`products:${storeId}`], revalidate: REVALIDATE },
  )()
}

// ---------------------------------------------------------------------------
// Single product
// ---------------------------------------------------------------------------

export function getProduct(productId: string, storeId: string) {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("products")
        .select("*, collections(name)")
        .eq("id", productId)
        .eq("store_id", storeId)
        .single()
      return data
    },
    [`product-${productId}`],
    { tags: [`product:${productId}`, `products:${storeId}`], revalidate: REVALIDATE },
  )()
}

// ---------------------------------------------------------------------------
// Product variants
// ---------------------------------------------------------------------------

export function getProductVariants(productId: string) {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("product_variants")
        .select("id, options, price, compare_at_price, sku, stock, is_available")
        .eq("product_id", productId)
        .order("sort_order")
      return data
    },
    [`variants-${productId}`],
    { tags: [`product:${productId}`], revalidate: REVALIDATE },
  )()
}

// ---------------------------------------------------------------------------
// Image URL resolution
// ---------------------------------------------------------------------------

export function resolveImageUrls(imageIds: string[]) {
  if (imageIds.length === 0) return Promise.resolve(new Map<string, string>())

  const sortedIds = [...imageIds].sort()
  const cacheKey = `images-${sortedIds.join(",")}`

  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data: imgs } = await supabase
        .from("store_images")
        .select("id, storage_path")
        .in("id", sortedIds)

      const entries: [string, string][] = (imgs || [])
        .map((i) => [i.id, getImageUrl(i.storage_path)!] as [string, string])
        .filter(([, url]) => url != null)

      return entries
    },
    [cacheKey],
    { revalidate: IMAGE_REVALIDATE },
  )().then((entries) => new Map(entries))
}

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

export function getStoreMarkets(storeId: string) {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("markets")
        .select("id, name, slug, countries, currency, pricing_mode, price_adjustment, is_default, is_active")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
      return data
    },
    [`markets-${storeId}`],
    { tags: [`markets:${storeId}`], revalidate: REVALIDATE },
  )()
}

export function getMarketPrices(marketId: string, productIds: string[]) {
  const sortedIds = [...productIds].sort()
  return unstable_cache(
    async () => {
      const supabase = createStaticClient()
      const { data } = await supabase
        .from("market_prices")
        .select("product_id, variant_id, price, compare_at_price")
        .eq("market_id", marketId)
        .in("product_id", sortedIds)
      return data
    },
    [`market-prices-${marketId}-${sortedIds.join(",")}`],
    { tags: [`market-prices:${marketId}`], revalidate: REVALIDATE },
  )()
}

// ---------------------------------------------------------------------------
// Store integration
// ---------------------------------------------------------------------------

export function getStoreIntegration(storeId: string, integrationId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("store_integrations")
        .select("config")
        .eq("store_id", storeId)
        .eq("integration_id", integrationId)
        .single()
      return data
    },
    [`integration-${storeId}-${integrationId}`],
    { tags: [`integrations:${storeId}`], revalidate: REVALIDATE },
  )()
}
