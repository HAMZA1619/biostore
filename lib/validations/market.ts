import { z } from "zod"

export const marketSchema = z.object({
  name: z.string().min(1, "validation.marketNameRequired"),
  slug: z
    .string()
    .min(2, "validation.marketSlugMin")
    .max(10, "validation.marketSlugMax")
    .regex(/^[a-z0-9-]+$/, "validation.slugFormat"),
  countries: z.array(z.string()).min(1, "validation.countriesRequired"),
  currency: z.string().min(1, "validation.currencyRequired"),
  pricing_mode: z.enum(["fixed", "auto"]),
  price_adjustment: z.number().min(-99).max(999).default(0),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

export type MarketFormData = z.input<typeof marketSchema>
