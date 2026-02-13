"use client"

import Link from "next/link"
import { T } from "@/components/dashboard/translated-text"

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <>
      <style>{`:root { --trial-banner-height: 36px; }`}</style>
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-1.5 text-center text-sm text-amber-700 dark:text-amber-400">
        <span>
          <T k="billing.trialBanner" /> ({daysLeft}d)
        </span>
        <Link href="/dashboard/settings" className="font-medium underline underline-offset-2">
          <T k="billing.subscribe" />
        </Link>
      </div>
    </>
  )
}
