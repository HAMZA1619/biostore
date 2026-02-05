export const TIER_LIMITS = {
  free: { maxProducts: 10, analytics: false, customTheme: false, branding: true },
  pro: { maxProducts: Infinity, analytics: true, customTheme: true, branding: false },
} as const

export type Tier = keyof typeof TIER_LIMITS

export function getTierLimits(tier: Tier) {
  return TIER_LIMITS[tier]
}
