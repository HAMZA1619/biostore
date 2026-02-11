import { handleWhatsApp } from "@/lib/integrations/apps/whatsapp"

interface IntegrationEvent {
  event_type: string
  payload: Record<string, unknown>
}

interface StoreIntegration {
  integration_id: string
  config: Record<string, unknown>
}

interface StoreInfo {
  name: string
  currency: string
  language: string
}

export async function dispatchEvent(
  event: IntegrationEvent,
  integrations: StoreIntegration[],
  store: StoreInfo
): Promise<string[]> {
  const errors: string[] = []

  for (const integration of integrations) {
    try {
      switch (integration.integration_id) {
        case "whatsapp":
          await handleWhatsApp(
            event.event_type,
            event.payload as unknown as Parameters<typeof handleWhatsApp>[1],
            integration.config as unknown as Parameters<typeof handleWhatsApp>[2],
            store.name,
            store.currency,
            store.language
          )
          break
        default:
          break
      }
    } catch (err) {
      errors.push(
        `${integration.integration_id}: ${err instanceof Error ? err.message : "Unknown error"}`
      )
    }
  }

  return errors
}
