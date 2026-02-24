import { GoogleAnalyticsIcon } from "@/components/icons/google-analytics"
import type { AppDefinition } from "@/lib/integrations/registry"

export const googleAnalyticsApp: AppDefinition = {
  id: "google-analytics",
  name: "Google Analytics",
  description: "Add Google Analytics tracking to measure your store traffic, user behavior, and e-commerce performance.",
  icon: GoogleAnalyticsIcon,
  iconColor: "#E37400",
  category: "analytics",
  events: [],
  hasCustomSetup: true,
}
