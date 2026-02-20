import { whatsappApp } from "@/lib/integrations/apps/whatsapp"
import { metaCapiApp } from "@/lib/integrations/apps/meta-capi"
import { tiktokEapiApp } from "@/lib/integrations/apps/tiktok-eapi"
import { googleSheetsApp } from "@/lib/integrations/apps/google-sheets"

export type IntegrationEventType = "order.created" | "order.status_changed" | "checkout.abandoned"

export interface AppDefinition {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  iconColor?: string
  category: "notifications" | "shipping" | "analytics" | "productivity"
  events: IntegrationEventType[]
  hasCustomSetup: boolean
}

export const APPS: Record<string, AppDefinition> = {
  whatsapp: whatsappApp,
  "meta-capi": metaCapiApp,
  "tiktok-eapi": tiktokEapiApp,
  "google-sheets": googleSheetsApp,
}

export const APP_LIST = Object.values(APPS)
