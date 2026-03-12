import { SupabaseClient } from "@supabase/supabase-js"
import { getResourceLimit, type ResourceType, type Tier } from "@/lib/tier"

export type LimitCheckResult = {
  allowed: boolean
  current: number
  limit: number
  tier: Tier
}

/**
 * Check whether a user can create another resource of the given type.
 * Works with the server-side Supabase client (uses auth.getUser internally).
 */
export async function checkResourceLimit(
  supabase: SupabaseClient,
  userId: string,
  storeId: string,
  resource: ResourceType
): Promise<LimitCheckResult> {
  // Get user tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", userId)
    .single()

  const tier: Tier = profile?.subscription_status === "active" ? (profile.subscription_tier as Tier) || "free" : "free"
  const limit = getResourceLimit(tier, resource)

  if (limit === Infinity) {
    return { allowed: true, current: 0, limit, tier }
  }

  // Count existing resources
  const { count } = await supabase
    .from(resource)
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)

  const current = count ?? 0

  return {
    allowed: current < limit,
    current,
    limit,
    tier,
  }
}

export function limitErrorMessage(resource: string, limit: number): string {
  const label = resource.replace(/_/g, " ").replace("store ", "")
  return `You've reached the free tier limit of ${limit} ${label}. Upgrade to Pro for unlimited ${label}.`
}
