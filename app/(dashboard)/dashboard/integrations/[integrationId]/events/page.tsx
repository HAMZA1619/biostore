import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { APPS } from "@/lib/integrations/registry"
import { IntegrationEventsTable } from "@/components/dashboard/integration-events-table"

const PAGE_SIZE = 20

export default async function IntegrationEventsPage({
  params,
}: {
  params: Promise<{ integrationId: string }>
}) {
  const { integrationId } = await params
  const app = APPS[integrationId]
  if (!app) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: events } = await supabase
    .from("integration_events")
    .select("id, integration_id, event_type, payload, status, error, processed_at, created_at")
    .eq("store_id", store.id)
    .eq("integration_id", integrationId)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <IntegrationEventsTable
      appName={app.name}
      integrationId={integrationId}
      initialEvents={events || []}
      hasMore={(events?.length || 0) === PAGE_SIZE}
    />
  )
}
