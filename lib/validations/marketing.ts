import { z } from "zod"

export const marketingSchema = z.object({
  ga_measurement_id: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, "marketing.invalidGaId")
    .or(z.literal(""))
    .transform((v) => v || null),
})

export type MarketingFormData = z.infer<typeof marketingSchema>
