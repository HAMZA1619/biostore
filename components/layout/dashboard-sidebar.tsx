"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Store,
  Paintbrush,
  Package,
  FolderOpen,
  ShoppingCart,
  Settings,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLanguageStore } from "@/lib/store/language-store"
import "@/lib/i18n"

const navItems = [
  { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/dashboard/store", labelKey: "nav.store", icon: Store },
  { href: "/dashboard/store/theme", labelKey: "nav.design", icon: Paintbrush },
  { href: "/dashboard/products", labelKey: "nav.products", icon: Package },
  { href: "/dashboard/collections", labelKey: "nav.collections", icon: FolderOpen },
  { href: "/dashboard/orders", labelKey: "nav.orders", icon: ShoppingCart },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
]

function SidebarContent({ pathname, onNavigate }: {
  pathname: string
  onNavigate?: () => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold" onClick={onNavigate}>
          {t("nav.brandName")}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-primary/5 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-screen w-64 flex-col border-e bg-muted/30 md:flex">
      <SidebarContent pathname={pathname} />
    </aside>
  )
}

export function MobileNav() {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex items-center md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={language === "ar" ? "right" : "left"} className="flex w-64 flex-col p-0">
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="ms-2 text-lg font-bold">
        {t("nav.brandName")}
      </Link>
    </div>
  )
}
