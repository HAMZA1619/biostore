import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FaqManager } from "@/components/forms/faq-manager"

export default async function FaqsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/dashboard/store")

  const { data: faqs } = await supabase
    .from("store_faqs")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order")

  return (
    <div className="space-y-4">
      <FaqManager storeId={store.id} initialFaqs={faqs || []} />
    </div>
  )
}
