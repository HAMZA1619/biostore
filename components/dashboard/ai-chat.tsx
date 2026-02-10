"use client"

import { useRef, useEffect } from "react"
import { useChatStore } from "@/lib/store/chat-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export function AiChat() {
  const { t } = useTranslation()
  const {
    messages,
    isOpen,
    isLoading,
    addMessage,
    updateMessage,
    setOpen,
    setLoading,
    clearMessages,
  } = useChatStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return

    addMessage({ role: "user", content: content.trim() })
    setLoading(true)

    const assistantId = addMessage({ role: "assistant", content: "" })

    try {
      const history = useChatStore
        .getState()
        .messages.slice(0, -1)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim(), history }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || t("aiChat.error"))
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        updateMessage(assistantId, accumulated)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("aiChat.error")
      updateMessage(assistantId, msg)
    } finally {
      setLoading(false)
    }
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
        <div className="fixed bottom-20 end-4 z-50 flex w-[calc(100vw-2rem)] flex-col rounded-xl border bg-background shadow-xl sm:w-96"
          style={{ maxHeight: "500px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">{t("aiChat.title")}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearMessages}
                title={t("aiChat.clearChat")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4"
            style={{ minHeight: "300px", maxHeight: "380px" }}
          >
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {t("aiChat.greeting")}
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
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
                      {t("aiChat.thinking")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
            <Input
              ref={inputRef}
              name="message"
              placeholder={t("aiChat.placeholder")}
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
      <button
        onClick={() => setOpen(!isOpen)}
        className="fixed bottom-4 end-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>
    </>
  )
}
