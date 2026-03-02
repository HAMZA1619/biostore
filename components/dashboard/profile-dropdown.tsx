"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LogOut, Settings, HelpCircle, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import "@/lib/i18n"

export function ProfileDropdown({
  email,
  initials,
}: {
  email: string
  initials: string
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{initials}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            <Settings className="me-2 h-4 w-4" />
            {t("nav.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/docs" target="_blank" rel="noopener noreferrer">
              <HelpCircle className="me-2 h-4 w-4" />
              {t("nav.helpCenter")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="me-2 h-4 w-4" /> : <Moon className="me-2 h-4 w-4" />}
            {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowLogoutDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="me-2 h-4 w-4" />
            {t("nav.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("nav.logoutTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("nav.logoutDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("nav.logoutCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>{t("nav.logoutConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
