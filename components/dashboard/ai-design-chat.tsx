"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wand2, X, Send, Loader2, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useChatStore } from "@/lib/store/chat-store"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import type { DesignState } from "./design-preview"

interface AiDesignChatProps {
  currentState: DesignState
  onChange: (patch: Partial<DesignState>) => void
}

interface DesignChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  changes?: Partial<DesignState>
  applied?: boolean
}

const SUGGESTION_KEYS = [
  "aiDesignChat.suggestion1",
  "aiDesignChat.suggestion2",
  "aiDesignChat.suggestion3",
  "aiDesignChat.suggestion4",
]

export function AiDesignChat({ currentState, onChange }: AiDesignChatProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<DesignChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const generalChatIsOpen = useChatStore((s) => s.isOpen)
  const closeGeneralChat = useChatStore((s) => s.setOpen)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Mutual exclusion: close design chat when general chat opens
  useEffect(() => {
    if (generalChatIsOpen && isOpen) {
      setIsOpen(false)
    }
  }, [generalChatIsOpen, isOpen])

  function handleOpen() {
    closeGeneralChat(false)
    setIsOpen(true)
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return

    const userMsg: DesignChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content.trim(),
          currentState,
          history,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || t("aiDesignChat.error"))
      }

      const data = await res.json()

      const assistantMsg: DesignChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.explanation || t("aiDesignChat.error"),
        changes:
          data.changes && Object.keys(data.changes).length > 0
            ? data.changes
            : undefined,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : t("aiDesignChat.error")
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: msg,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleApply(msgId: string, changes: Partial<DesignState>) {
    onChange(changes)
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    )
    toast.success(t("aiDesignChat.applySuccess"))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem("message") as HTMLInputElement
    if (input.value.trim()) {
      sendMessage(input.value)
      input.value = ""
    }
  }

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="flex max-h-[660px] w-80 shrink-0 flex-col rounded-xl border bg-background shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              {t("aiDesignChat.title")}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMessages([])}
                title={t("aiDesignChat.clearChat")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  {t("aiDesignChat.greeting")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                      onClick={() => sendMessage(t(key))}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.content || (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("aiDesignChat.thinking")}
                    </span>
                  )}
                </div>
                {msg.role === "assistant" && msg.changes && (
                  <Button
                    size="sm"
                    className="mt-1.5"
                    disabled={msg.applied}
                    onClick={() => handleApply(msg.id, msg.changes!)}
                  >
                    {msg.applied ? (
                      <>
                        <Check className="me-1.5 h-3 w-3" />
                        {t("aiDesignChat.applied")}
                      </>
                    ) : (
                      t("aiDesignChat.apply")
                    )}
                  </Button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("aiDesignChat.thinking")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
            <Input
              ref={inputRef}
              name="message"
              placeholder={t("aiDesignChat.placeholder")}
              disabled={isLoading}
              autoComplete="off"
              className="h-9 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Floating button */}
      {!isOpen && (
      <button
        onClick={handleOpen}
        className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Wand2 className="h-4 w-4" />
      </button>
      )}
    </>
  )
}
