"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface TimeLeft {
  d: number
  h: number
  m: number
  s: number
}

function calcTimeLeft(target: number): TimeLeft | null {
  const diff = target - Date.now()
  if (diff <= 0) return null
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-px">
      <span className="rounded bg-white/20 px-1 py-px text-[0.65rem] font-bold leading-tight tabular-nums sm:px-1.5 sm:text-xs">
        {value}
      </span>
      <span className="text-[0.45rem] uppercase leading-none opacity-70 sm:text-[0.5rem]">{label}</span>
    </div>
  )
}

function Separator() {
  return <span className="text-[0.6rem] font-bold opacity-50 self-start mt-px sm:text-[0.65rem]">:</span>
}

export function AnnouncementCountdown({ targetDate, sticky }: { targetDate: string; sticky?: boolean }) {
  const [time, setTime] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const syncHeight = useCallback(() => {
    if (!sticky || !ref.current) return
    const bar = ref.current.closest("[data-announcement]") as HTMLElement | null
    const root = ref.current.closest(".storefront") as HTMLElement | null
    if (bar && root) {
      root.style.setProperty("--announcement-h", `${bar.offsetHeight}px`)
    }
  }, [sticky])

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    setTime(calcTimeLeft(target))
    setMounted(true)

    const interval = setInterval(() => {
      const t = calcTimeLeft(target)
      if (!t) clearInterval(interval)
      setTime(t)
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  useEffect(() => {
    if (!sticky || !ref.current) return
    syncHeight()
    const bar = ref.current.closest("[data-announcement]") as HTMLElement | null
    if (!bar) return
    const ro = new ResizeObserver(syncHeight)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [sticky, mounted, syncHeight])

  if (!mounted || !time) return null

  return (
    <div ref={ref} dir="ltr" className="inline-flex items-center gap-0.5 sm:gap-1 font-mono">
      {time.d > 0 && (
        <>
          <Digit value={String(time.d)} label="d" />
          <Separator />
        </>
      )}
      <Digit value={String(time.h).padStart(2, "0")} label="h" />
      <Separator />
      <Digit value={String(time.m).padStart(2, "0")} label="m" />
      <Separator />
      <Digit value={String(time.s).padStart(2, "0")} label="s" />
    </div>
  )
}
