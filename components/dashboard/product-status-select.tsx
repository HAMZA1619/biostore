"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface ProductStatusSelectProps {
  productId: string
  status: string
}

export function ProductStatusSelect({ productId, status }: ProductStatusSelectProps) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(status)
  const router = useRouter()
  const supabase = createClient()

  async function handleChange(value: string) {
    const prev = current
    setCurrent(value)

    const { error } = await supabase
      .from("products")
      .update({ status: value, updated_at: new Date().toISOString() })
      .eq("id", productId)

    if (error) {
      setCurrent(prev)
      toast.error(t("products.failedUpdateStatus"))
    } else {
      router.refresh()
    }
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
          current === "active"
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {t("products.statusActive")}
        </SelectItem>
        <SelectItem value="draft">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          {t("products.statusDraft")}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
