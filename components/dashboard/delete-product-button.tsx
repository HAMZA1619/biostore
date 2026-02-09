"use client"

import { createClient } from "@/lib/supabase/client"
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
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function ProductActions({ productId }: { productId: string }) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    const { error } = await supabase.from("products").delete().eq("id", productId)
    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }
    toast.success(t("products.deleted"))
    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${productId}/edit`}>
              <Pencil className="me-2 h-4 w-4" />
              {t("deleteProduct.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="me-2 h-4 w-4" />
            {t("deleteProduct.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteProduct.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteProduct.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteProduct.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {t("deleteProduct.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
