import { whatsappApp } from "@/lib/integrations/apps/whatsapp"
import { metaCapiApp } from "@/lib/integrations/apps/meta-capi"

export type IntegrationEventType = "order.created" | "order.status_changed"

export interface AppDefinition {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
  category: "notifications" | "shipping" | "analytics"
  events: IntegrationEventType[]
  hasCustomSetup: boolean
}

export const APPS: Record<string, AppDefinition> = {
  whatsapp: whatsappApp,
  "meta-capi": metaCapiApp,
}

export const APP_LIST = Object.values(APPS)
