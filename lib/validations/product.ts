import { z } from "zod"

export const productOptionSchema = z.object({
  name: z.string().min(1, "validation.optionNameRequired"),
  values: z.array(z.string().min(1)).min(1, "validation.atLeastOneValue"),
})

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  options: z.record(z.string(), z.string()),
  price: z.number().positive("validation.priceMustBePositive"),
  compare_at_price: z
    .union([z.number().positive(), z.nan(), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null))
    .optional(),
  sku: z.string().max(100).optional(),
  stock: z
    .union([z.number().int().min(0).max(1000), z.nan(), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? Math.min(v, 1000) : null))
    .optional(),
  is_available: z.boolean(),
})

export const productSchema = z.object({
  name: z.string().min(1, "validation.productNameRequired"),
  sku: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().min(0, "validation.priceMustBePositive"),
  compare_at_price: z
    .union([z.number().min(0), z.nan(), z.undefined()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null))
    .optional(),
  stock: z
    .union([z.number().int().min(0).max(1000), z.nan(), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? Math.min(v, 1000) : null))
    .optional(),
  collection_id: z.string().optional(),
  status: z.enum(["active", "draft"]),
  is_available: z.boolean(),
})

export type ProductOption = z.infer<typeof productOptionSchema>
export type ProductVariant = z.infer<typeof productVariantSchema>
export type ProductFormData = z.infer<typeof productSchema>
