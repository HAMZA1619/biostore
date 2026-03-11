import { z } from "zod"

export const storeSchema = z.object({
  name: z.string().min(2, "validation.storeNameMin"),
  slug: z
    .string()
    .min(3, "validation.slugMin")
    .max(30, "validation.slugMax")
    .regex(/^[a-z0-9-]+$/, "validation.slugFormat")
    .refine((s) => !["app", "api", "admin", "www"].includes(s), "validation.slugReserved"),
  description: z.string().max(500).optional(),
  language: z.string().min(2).max(5).default("en"),
  currency: z.string().min(1, "validation.currencyRequired"),
  payment_methods: z.array(z.literal("cod")).default(["cod"]),
})

export type StoreFormData = z.infer<typeof storeSchema>
