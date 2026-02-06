"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ORDER_STATUSES } from "@/lib/constants"

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500", label: "Pending" },
  confirmed: { color: "bg-blue-500", label: "Confirmed" },
  shipped: { color: "bg-purple-500", label: "Shipped" },
  delivered: { color: "bg-green-500", label: "Delivered" },
  canceled: { color: "bg-red-400", label: "Canceled" },
}

interface OrderStatusSelectProps {
  orderId: string
  status: string
}

export function OrderStatusSelect({ orderId, status }: OrderStatusSelectProps) {
  const [current, setCurrent] = useState(status)
  const router = useRouter()
  const supabase = createClient()

  async function handleChange(value: string) {
    const prev = current
    setCurrent(value)

    const { error } = await supabase
      .from("orders")
      .update({ status: value, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) {
      setCurrent(prev)
      toast.error("Failed to update status")
    } else {
      router.refresh()
    }
  }

  const cfg = statusConfig[current] || { color: "bg-gray-400", label: current }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[130px] border-transparent bg-transparent px-2 hover:bg-muted/50">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
            <span className="text-sm">{cfg.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => {
          const c = statusConfig[s] || { color: "bg-gray-400", label: s }
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.color}`} />
                {c.label}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
