import { z } from "zod"

export const orderSchema = z.object({
  store_id: z.string().uuid(),
  customer_name: z.string().min(2, "validation.nameRequired"),
  customer_phone: z.string().min(8, "validation.phoneRequired"),
  customer_city: z.string().min(1, "validation.cityRequired"),
  customer_address: z.string().min(5, "validation.addressRequired"),
  payment_method: z.literal("cod").default("cod"),
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "validation.cartEmpty"),
})

export type OrderFormData = z.infer<typeof orderSchema>
