"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm("Delete this product?")) return

    const { error } = await supabase.from("products").delete().eq("id", productId)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Product deleted")
    router.refresh()
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  )
}
