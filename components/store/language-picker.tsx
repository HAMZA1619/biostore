"use client"

import { useState } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

interface LanguagePickerProps {
  languages: { code: string; name: string }[]
  activeLanguage: string
}

export function LanguagePicker({ languages, activeLanguage }: LanguagePickerProps) {
  const [open, setOpen] = useState(false)

  const active = languages.find((l) => l.code === activeLanguage) || languages[0]

  function handleSelect(code: string) {
    document.cookie = `leadivo-lang=${code};path=/;max-age=31536000;SameSite=Lax`
    setOpen(false)
    window.location.reload()
  }

  if (languages.length <= 1) return null

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" style={{ color: "var(--store-text)", fontFamily: "var(--store-font)" }}>
          <Languages className="h-3.5 w-3.5" />
          <span>{active?.code.toUpperCase()}</span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        align="end"
        sideOffset={4}
        className="z-50 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        style={{ borderRadius: "var(--store-radius)", fontFamily: "var(--store-font)" }}
      >
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              l.code === active?.code ? "font-medium text-primary" : ""
            )}
            style={{ borderRadius: "var(--store-radius)" }}
          >
            <span>{l.name}</span>
            <span className="text-xs text-muted-foreground">{l.code.toUpperCase()}</span>
          </button>
        ))}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
