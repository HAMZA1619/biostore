export const TIER_LIMITS = {
  free: {
    maxProducts: 10,
    maxCollections: 3,
    maxDiscounts: 3,
    maxMarkets: 3,
    maxShippingZones: 3,
    maxIntegrations: Infinity,
    maxImages: 50,
    analytics: true,
    customTheme: true,
    branding: true,
  },
  pro: {
    maxProducts: Infinity,
    maxCollections: Infinity,
    maxDiscounts: Infinity,
    maxMarkets: Infinity,
    maxShippingZones: Infinity,
    maxIntegrations: Infinity,
    maxImages: Infinity,
    analytics: true,
    customTheme: true,
    branding: false,
  },
} as const

export type Tier = keyof typeof TIER_LIMITS

export type ResourceType = "products" | "collections" | "discounts" | "markets" | "shipping_zones" | "store_integrations" | "store_images"

const RESOURCE_LIMIT_KEY: Record<ResourceType, keyof typeof TIER_LIMITS.free> = {
  products: "maxProducts",
  collections: "maxCollections",
  discounts: "maxDiscounts",
  markets: "maxMarkets",
  shipping_zones: "maxShippingZones",
  store_integrations: "maxIntegrations",
  store_images: "maxImages",
}

export function getTierLimits(tier: Tier) {
  return TIER_LIMITS[tier]
}

export function getResourceLimit(tier: Tier, resource: ResourceType): number {
  const key = RESOURCE_LIMIT_KEY[resource]
  return TIER_LIMITS[tier][key] as number
}
