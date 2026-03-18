"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FaqAccordionProps {
  faqs: { question: string; answer: string }[]
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2" style={{ gap: "var(--store-grid-gap, 0.5rem)" }}>
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border"
          style={{
            borderRadius: "var(--store-radius)",
            boxShadow: "var(--store-card-shadow)",
          }}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between gap-2 px-3 py-3 text-start"
          >
            <h3
              className="text-sm font-semibold leading-snug"
              style={{ fontFamily: "var(--store-heading-font)" }}
            >
              {faq.question}
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <p className="px-3 pb-3 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
