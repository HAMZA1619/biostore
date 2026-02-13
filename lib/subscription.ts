export type SubscriptionStatus = "trialing" | "active" | "past_due" | "expired" | "canceled"

export type SubscriptionAccess = {
  hasAccess: boolean
  status: SubscriptionStatus
  trialDaysLeft: number | null
}

export function getSubscriptionAccess(profile: {
  subscription_status: string | null
  trial_ends_at: string | null
}): SubscriptionAccess {
  const subStatus = profile.subscription_status

  if (subStatus === "active") {
    return { hasAccess: true, status: "active", trialDaysLeft: null }
  }

  if (subStatus === "past_due") {
    return { hasAccess: true, status: "past_due", trialDaysLeft: null }
  }

  if (subStatus === "trialing" && profile.trial_ends_at) {
    const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now()
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))

    if (msLeft > 0) {
      return { hasAccess: true, status: "trialing", trialDaysLeft: daysLeft }
    }
  }

  if (subStatus === "canceled") {
    return { hasAccess: true, status: "canceled", trialDaysLeft: null }
  }

  return { hasAccess: false, status: "expired", trialDaysLeft: 0 }
}
