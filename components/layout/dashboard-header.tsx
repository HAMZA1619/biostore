import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { MobileNav } from "@/components/layout/dashboard-sidebar"
import { T } from "@/components/dashboard/translated-text"
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown"

export async function DashboardHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: store } = await supabase
    .from("stores")
    .select("slug")
    .eq("owner_id", user?.id)
    .single()

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        {store?.slug && (
          <Link
            href={`/${store.slug}`}
            target="_blank"
            className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex"
          >
            <T k="nav.viewStore" /> <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
        <ProfileDropdown email={user?.email || ""} initials={initials} />
      </div>
    </header>
  )
}
