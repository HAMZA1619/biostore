import { z } from "zod"

export const orderSchema = z.object({
  store_id: z.string().uuid(),
  customer_name: z.string().min(2, "Name is required"),
  customer_phone: z.string().min(8, "Phone number is required"),
  customer_city: z.string().min(1, "City is required"),
  customer_address: z.string().min(5, "Address is required"),
  payment_method: z.enum(["cod", "bank_transfer"]).default("cod"),
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Cart cannot be empty"),
})

export type OrderFormData = z.infer<typeof orderSchema>
