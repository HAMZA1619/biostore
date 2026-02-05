import { z } from "zod"

export const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().max(1000).optional(),
    price: z.number().positive("Price must be positive"),
    compare_at_price: z
      .union([z.number().positive(), z.nan(), z.undefined()])
      .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null))
      .optional(),
    collection_id: z.string().optional(),
    is_available: z.boolean(),
    product_type: z.enum(["regular", "external"]),
    external_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  })
  .refine(
    (data) => data.product_type !== "external" || (data.external_url && data.external_url.length > 0),
    { message: "External URL is required for external products", path: ["external_url"] }
  )

export type ProductFormData = z.infer<typeof productSchema>
