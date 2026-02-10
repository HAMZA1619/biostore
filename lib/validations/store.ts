import { z } from "zod"

export const storeSchema = z.object({
  name: z.string().min(2, "validation.storeNameMin"),
  slug: z
    .string()
    .min(3, "validation.slugMin")
    .max(30, "validation.slugMax")
    .regex(/^[a-z0-9-]+$/, "validation.slugFormat"),
  description: z.string().max(500).optional(),
  city: z.string().optional(),
  language: z.enum(["en", "fr", "ar"]).default("en"),
  currency: z.string().min(1, "validation.currencyRequired"),
  payment_methods: z.array(z.literal("cod")).default(["cod"]),
  primary_color: z.string(),
  accent_color: z.string(),
  ga_measurement_id: z.string().optional().default(""),
  fb_pixel_id: z.string().optional().default(""),
})

export type StoreFormData = z.infer<typeof storeSchema>
