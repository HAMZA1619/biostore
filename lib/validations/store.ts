import { z } from "zod"

export const storeSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be 30 characters or less")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  city: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  payment_methods: z.array(z.literal("cod")).default(["cod"]),
  primary_color: z.string(),
  accent_color: z.string(),
})

export type StoreFormData = z.infer<typeof storeSchema>
