"use client"

import { timeAgo } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RelativeDate({ date }: { date: string }) {
  const full = new Date(date).toLocaleString()

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger className="text-sm text-muted-foreground">
          {timeAgo(date)}
        </TooltipTrigger>
        <TooltipContent>
          <p>{full}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
