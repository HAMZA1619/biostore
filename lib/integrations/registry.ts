import type { LucideIcon } from "lucide-react"
import { whatsappApp } from "@/lib/integrations/apps/whatsapp"

export type IntegrationEventType = "order.created" | "order.status_changed"

export interface AppDefinition {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: "notifications" | "shipping" | "analytics"
  events: IntegrationEventType[]
  hasCustomSetup: boolean
}

export const APPS: Record<string, AppDefinition> = {
  whatsapp: whatsappApp,
}

export const APP_LIST = Object.values(APPS)
