import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StoreForm } from "@/components/forms/store-form"

export default async function StorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {store ? "Store Settings" : "Create Your Store"}
      </h1>
      <StoreForm userId={user.id} initialData={store} />
    </div>
  )
}
