"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { formatPrice } from "@/lib/utils"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
              <TableHead className="hidden sm:table-cell">{t("discounts.columns.code")}</TableHead>
              <TableHead>{t("discounts.columns.discount")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("discounts.columns.usage")}</TableHead>
              <TableHead>{t("discounts.columns.status")}</TableHead>
              <TableHead className="w-[100px] text-end">{t("discounts.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell className="max-w-[150px] truncate font-medium sm:max-w-[200px]">
                  <Link href={`/dashboard/discounts/${discount.id}/edit`} className="hover:underline">
                    {discount.label}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {discount.type === "code" ? (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {discount.code}
                    </code>
                  ) : (
                    <Badge variant="secondary">{t("discounts.automatic")}</Badge>
                  )}
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
                  <Badge variant={discount.is_active ? "default" : "secondary"}>
                    {discount.is_active ? t("discounts.active") : t("discounts.inactive")}
                  </Badge>
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
