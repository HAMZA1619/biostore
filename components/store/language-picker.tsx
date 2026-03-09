"use client"

import { useState } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
          <Languages className="h-3.5 w-3.5" />
          <span>{active?.code.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
              l.code === active?.code ? "font-medium text-primary" : ""
            }`}
          >
            <span>{l.name}</span>
            <span className="text-muted-foreground text-xs">{l.code.toUpperCase()}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
