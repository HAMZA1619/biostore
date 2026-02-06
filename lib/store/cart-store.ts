"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  variantId: string | null
  name: string
  variantLabel: string | null
  price: number
  quantity: number
  imageUrl: string | null
}

function cartItemKey(productId: string, variantId: string | null | undefined): string {
  return variantId ? `${productId}:${variantId}` : productId
}

function itemMatches(item: CartItem, productId: string, variantId: string | null | undefined): boolean {
  return item.productId === productId && (item.variantId || null) === (variantId || null)
}

interface CartStore {
  items: CartItem[]
  storeSlug: string | null
  addItem: (item: Omit<CartItem, "quantity">, storeSlug: string) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void
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

        const existing = items.find((i) => itemMatches(i, item.productId, item.variantId))
        if (existing) {
          set({
            items: items.map((i) =>
              itemMatches(i, item.productId, item.variantId)
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

      removeItem: (productId, variantId) => {
        set({ items: get().items.filter((i) => !itemMatches(i, productId, variantId)) })
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set({
          items: get().items.map((i) =>
            itemMatches(i, productId, variantId) ? { ...i, quantity } : i
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
