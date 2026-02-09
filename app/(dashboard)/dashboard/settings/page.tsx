import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { T } from "@/components/dashboard/translated-text"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold"><T k="settings.title" /></h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base"><T k="settings.profile" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground"><T k="settings.name" /></span>
            <span>{profile?.full_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground"><T k="settings.email" /></span>
            <span>{user.email}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
