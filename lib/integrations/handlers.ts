import { handleWhatsApp } from "@/lib/integrations/apps/whatsapp"
import { handleMetaCAPI } from "@/lib/integrations/apps/meta-capi"

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

export async function dispatchSingle(
  event: IntegrationEvent,
  integration: StoreIntegration,
  store: StoreInfo,
): Promise<void> {
  switch (integration.integration_id) {
    case "whatsapp":
      await handleWhatsApp(
        event.event_type,
        event.payload as unknown as Parameters<typeof handleWhatsApp>[1],
        integration.config as unknown as Parameters<typeof handleWhatsApp>[2],
        store.name,
        store.currency,
        store.language,
      )
      break
    case "meta-capi":
      await handleMetaCAPI(
        event.event_type,
        event.payload as unknown as Parameters<typeof handleMetaCAPI>[1],
        integration.config as unknown as Parameters<typeof handleMetaCAPI>[2],
        store.name,
        store.currency,
      )
      break
    default:
      break
  }
}
