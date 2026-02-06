"use client"

import { X } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

interface OptionValuesInputProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export function OptionValuesInput({ values, onChange, placeholder = "Type and press Enter" }: OptionValuesInputProps) {
  const [input, setInput] = useState("")

  function addValue(raw: string) {
    const v = raw.trim()
    if (v && !values.includes(v)) {
      onChange([...values, v])
    }
    setInput("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addValue(input)
    }
    if (e.key === "Backspace" && !input && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function removeValue(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-sm"
        >
          {v}
          <button
            type="button"
            onClick={() => removeValue(i)}
            className="rounded-sm hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addValue(input) }}
        placeholder={values.length === 0 ? placeholder : ""}
        className="min-w-[80px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
