import { z } from "zod"

export const shippingZoneSchema = z.object({
  country_code: z.string().length(2),
  country_name: z.string().min(1),
  default_rate: z.number().min(0).max(99999),
  is_active: z.boolean().default(true),
})

export const shippingCityRateSchema = z
  .object({
    city_name: z.string().min(1),
    rate: z.number().min(0).max(99999).nullable(),
    is_excluded: z.boolean().default(false),
  })
  .refine((data) => data.is_excluded || data.rate !== null, {
    message: "Rate is required when city is not excluded",
    path: ["rate"],
  })

export type ShippingZoneFormData = z.input<typeof shippingZoneSchema>
export type ShippingCityRateFormData = z.input<typeof shippingCityRateSchema>
