import { create } from "zustand"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: number
}

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => string
  updateMessage: (id: string, content: string) => void
  setOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,

  addMessage: (message) => {
    const id = crypto.randomUUID()
    set({
      messages: [...get().messages, { ...message, id, createdAt: Date.now() }],
    })
    return id
  },

  updateMessage: (id, content) => {
    set({
      messages: get().messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })
  },

  setOpen: (isOpen) => set({ isOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}))
