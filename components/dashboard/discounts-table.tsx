"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn, formatPrice } from "@/lib/utils"
import { Copy, Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface Discount {
  id: string
  type: string
  code: string | null
  label: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  times_used: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

interface DiscountsTableProps {
  initialDiscounts: Discount[]
  currency: string
}

export function DiscountsTable({ initialDiscounts, currency }: DiscountsTableProps) {
  const { t } = useTranslation()
  const [discounts, setDiscounts] = useState(initialDiscounts)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    if (!deleteId || deleting) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/discounts?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error(t("discounts.deleteFailed"))
        return
      }
      toast.success(t("discounts.deleted"))
      setDiscounts((prev) => prev.filter((d) => d.id !== deleteId))
      router.refresh()
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (discounts.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("discounts.empty")}
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("discounts.columns.label")}</TableHead>
              <TableHead>{t("discounts.columns.code")}</TableHead>
              <TableHead>{t("discounts.columns.discount")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("discounts.columns.usage")}</TableHead>
              <TableHead>{t("discounts.columns.status")}</TableHead>
              <TableHead className="w-[100px] text-end">{t("discounts.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  <Link href={`/dashboard/discounts/${discount.id}/edit`} className="hover:underline">
                    {discount.label || discount.code}
                  </Link>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-xs font-mono transition-colors hover:bg-muted/80"
                    onClick={() => {
                      navigator.clipboard.writeText(discount.code || "")
                      setCopiedId(discount.id)
                      toast.success(t("discounts.codeCopied"))
                      setTimeout(() => setCopiedId(null), 2000)
                    }}
                  >
                    {discount.code}
                    {copiedId === discount.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  {discount.discount_type === "percentage"
                    ? `${discount.discount_value}%`
                    : formatPrice(discount.discount_value, currency)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {discount.times_used}/{discount.max_uses ?? "∞"}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    discount.is_active
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", discount.is_active ? "bg-green-500" : "bg-red-400")} />
                    {discount.is_active ? t("discounts.active") : t("discounts.inactive")}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/discounts/${discount.id}/edit`}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t("discounts.edit")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(discount.id)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="me-2 h-4 w-4" />
                        {t("discounts.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discounts.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discounts.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("discounts.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {t("discounts.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
