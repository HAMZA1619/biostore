"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
}

interface CartStore {
  items: CartItem[]
  storeSlug: string | null
  addItem: (item: Omit<CartItem, "quantity">, storeSlug: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,

      addItem: (item, storeSlug) => {
        const { items, storeSlug: currentSlug } = get()

        // Clear cart if switching stores
        if (currentSlug && currentSlug !== storeSlug) {
          set({ items: [{ ...item, quantity: 1 }], storeSlug })
          return
        }

        const existing = items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            storeSlug,
          })
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }],
            storeSlug,
          })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [], storeSlug: null }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "biostore-cart" }
  )
)
