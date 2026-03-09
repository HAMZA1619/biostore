"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CopyOrderNumber({ orderNumber, label, copiedText }: { orderNumber: string; label: string; copiedText: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-lg opacity-60 transition-opacity hover:opacity-80"
    >
      <span>{label}</span>
      {copied ? (
        <Check className="h-4 w-4" style={{ color: "var(--store-accent)" }} />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied && (
        <span className="text-xs font-medium" style={{ color: "var(--store-accent)" }}>{copiedText}</span>
      )}
    </button>
  )
}
