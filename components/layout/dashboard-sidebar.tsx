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
  Ticket,
  MapPin,
  Puzzle,
  Settings,
  Menu,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BiostoreLogo } from "@/components/icons/biostore-logo"
import { useLanguageStore } from "@/lib/store/language-store"
import "@/lib/i18n"
import type { LucideIcon } from "lucide-react"

type NavItem = {
  href: string
  labelKey: string
  icon: LucideIcon
  children?: { href: string; labelKey: string }[]
}

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/dashboard/store", labelKey: "nav.store", icon: Store },
  { href: "/dashboard/store/theme", labelKey: "nav.design", icon: Paintbrush },
  { href: "/dashboard/products", labelKey: "nav.products", icon: Package },
  { href: "/dashboard/collections", labelKey: "nav.collections", icon: FolderOpen },
  {
    href: "/dashboard/orders",
    labelKey: "nav.orders",
    icon: ShoppingCart,
    children: [
      { href: "/dashboard/orders", labelKey: "nav.orders" },
      { href: "/dashboard/abandoned-checkouts", labelKey: "nav.checkouts" },
    ],
  },
  { href: "/dashboard/discounts", labelKey: "nav.discounts", icon: Ticket },
  { href: "/dashboard/markets", labelKey: "nav.markets", icon: MapPin },
  { href: "/dashboard/integrations", labelKey: "nav.integrations", icon: Puzzle },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
]

const allHrefs = navItems.flatMap((item) =>
  item.children ? item.children.map((c) => c.href) : [item.href]
)

function isActive(path: string, href: string): boolean {
  if (path === href) return true
  if (href === "/dashboard") return false
  if (!path.startsWith(href + "/")) return false
  return !allHrefs.some(
    (h) => h !== href && h.startsWith(href) && (path === h || path.startsWith(h + "/"))
  )
}

function SidebarContent({ pathname, onNavigate }: {
  pathname: string
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const ordersChildPaths = ["/dashboard/orders", "/dashboard/abandoned-checkouts"]
  const isOrdersActive = ordersChildPaths.some((p) => isActive(pathname, p))
  const [ordersOpen, setOrdersOpen] = useState(isOrdersActive)

  return (
    <>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" onClick={onNavigate}>
          <BiostoreLogo className="h-6" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = ordersOpen || isOrdersActive
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => { setOrdersOpen(true); onNavigate?.() }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isOrdersActive
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-start">{t(item.labelKey)}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !isOpen && "-rotate-90 rtl:rotate-90")} />
                </Link>
                {isOpen && (
                  <div className="ms-4 mt-0.5 space-y-0.5 border-s ps-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-sm transition-colors",
                          isActive(pathname, child.href)
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t(child.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { setOrdersOpen(false); onNavigate?.() }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(pathname, item.href)
                  ? "bg-primary/5 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          )
        })}
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
      <Link href="/dashboard" className="ms-2">
        <BiostoreLogo className="h-6" />
      </Link>
    </div>
  )
}
