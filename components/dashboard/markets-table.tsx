"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { DollarSign, EyeOff, MapPin, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { getCurrencySymbol } from "@/lib/utils"
import "@/lib/i18n"

interface Market {
  id: string
  name: string
  slug: string
  countries: string[]
  currency: string
  pricing_mode: string
  price_adjustment: number
  is_default: boolean
  is_active: boolean
}

interface MarketsTableProps {
  initialMarkets: Market[]
}

export function MarketsTable({ initialMarkets }: MarketsTableProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [markets, setMarkets] = useState(initialMarkets)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleToggleActive(market: Market) {
    const res = await fetch("/api/markets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: market.id, is_active: !market.is_active }),
    })
    if (res.ok) {
      setMarkets((prev) => prev.map((m) => m.id === market.id ? { ...m, is_active: !m.is_active } : m))
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/markets?id=${deleteId}`, { method: "DELETE" })
    if (res.ok) {
      setMarkets((prev) => prev.filter((m) => m.id !== deleteId))
      toast.success(t("markets.marketDeleted"))
      router.refresh()
    } else {
      toast.error(t("markets.deleteFailed"))
    }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h1 className="text-xl font-bold">{t("markets.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("markets.subtitle")}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/markets/new">
            <Plus className="me-2 h-4 w-4" />
            {t("markets.create")}
          </Link>
        </Button>
      </div>

      {markets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <MapPin className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-base font-medium">{t("markets.emptyTitle")}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("markets.emptyDescription")}</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard/markets/new">
              <Plus className="me-2 h-4 w-4" />
              {t("markets.createFirst")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("markets.name")}</TableHead>
                <TableHead>{t("markets.countries")}</TableHead>
                <TableHead>{t("markets.currency")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("markets.pricingMode")}</TableHead>
                <TableHead>{t("markets.isActive")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {markets.map((market) => (
                <TableRow key={market.id}>
                  <TableCell>
                    <Link href={`/dashboard/markets/${market.id}/edit`} className="block hover:underline">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{market.name}</span>
                        {market.is_default && (
                          <Badge variant="secondary" className="text-[10px]">{t("markets.default")}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{market.slug}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {market.countries.slice(0, 3).map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                      ))}
                      {market.countries.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{market.countries.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getCurrencySymbol(market.currency)} {market.currency}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm capitalize">
                      {market.pricing_mode === "auto"
                        ? `${t("markets.auto")} (${market.price_adjustment >= 0 ? "+" : ""}${market.price_adjustment}%)`
                        : t("markets.fixed")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={market.is_active}
                      onCheckedChange={() => handleToggleActive(market)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/markets/${market.id}/edit`}>
                            <Pencil className="me-2 h-4 w-4" />
                            {t("markets.edit")}
                          </Link>
                        </DropdownMenuItem>
                        {market.pricing_mode === "fixed" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/markets/${market.id}/pricing`}>
                              <DollarSign className="me-2 h-4 w-4" />
                              {t("markets.setPrices")}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/markets/${market.id}/exclusions`}>
                            <EyeOff className="me-2 h-4 w-4" />
                            {t("markets.manageAvailability")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(market.id)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t("markets.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("markets.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("markets.deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("markets.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("markets.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
