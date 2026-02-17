import { z } from "zod"

export const discountSchema = z.object({
  code: z.string().min(1, "validation.couponCodeRequired").max(50),
  label: z.string().max(100).optional().default(""),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive("validation.discountValueRequired"),
  minimum_order_amount: z
    .union([z.number().min(0), z.nan(), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null))
    .optional(),
  max_uses: z
    .union([z.number().int().min(1), z.nan(), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null))
    .optional(),
  max_uses_per_customer: z
    .union([z.number().int().min(1), z.nan(), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null))
    .optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  is_active: z.boolean(),
}).refine(
  (data) => {
    if (data.discount_type === "percentage") return data.discount_value <= 100
    return true
  },
  { message: "validation.percentageMax100", path: ["discount_value"] }
)

export type DiscountFormData = z.infer<typeof discountSchema>
