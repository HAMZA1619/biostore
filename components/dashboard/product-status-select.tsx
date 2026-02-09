"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
      <SelectTrigger className="h-8 w-[130px] border-transparent bg-transparent px-2 hover:bg-muted/50">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${current === "active" ? "bg-green-500" : "bg-red-400"}`} />
            <span className="text-sm">{current === "active" ? t("products.statusActive") : t("products.statusDraft")}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {t("products.statusActive")}
          </span>
        </SelectItem>
        <SelectItem value="draft">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            {t("products.statusDraft")}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
