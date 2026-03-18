import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkResourceLimit } from "@/lib/check-limit"
import { csvRowSchema } from "@/lib/validations/product"
import { slugify } from "@/lib/utils"

interface ParsedProduct {
  name: string
  description: string | null
  sku: string | null
  price: number
  compare_at_price: number | null
  status: string
  is_available: boolean
  stock: number | null
  image_url: string | null
  collection: string | null
  options: { name: string; values: string[] }[]
  variants: {
    options: Record<string, string>
    price: number
    compare_at_price: number | null
    sku: string | null
    stock: number | null
    is_available: boolean
  }[]
}

function parseRows(rows: Record<string, string>[]): { products: ParsedProduct[]; errors: string[] } {
  const errors: string[] = []
  const productMap = new Map<string, ParsedProduct>()
  const order: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    // Normalize keys to lowercase
    const row: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      row[k.toLowerCase().trim().replace(/\s+/g, "_")] = v?.trim() ?? ""
    }

    const title = row.title || row.name || ""
    const handle = row.handle || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    const priceStr = row.price || row.variant_price || "0"
    const price = parseFloat(priceStr)

    if (!title && !handle) {
      // Variant row — must have a handle that matches a previous product
      continue
    }

    // Parse CSV row through validation
    const parsed = csvRowSchema.safeParse({
      title,
      handle,
      description: row.description || row.body || row["body_(html)"] || undefined,
      sku: row.sku || undefined,
      price: isNaN(price) ? 0 : price,
      compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) || undefined : undefined,
      status: row.status === "draft" ? "draft" : "active",
      available: row.available === "false" ? false : true,
      stock: row.stock ? Math.min(parseInt(row.stock, 10) || 0, 1000) : undefined,
      image_url: row.image_url || row.image_src || row.image || undefined,
      collection: row.collection || row.type || row.product_type || undefined,
      option1_name: row.option1_name || undefined,
      option1_value: row.option1_value || undefined,
      option2_name: row.option2_name || undefined,
      option2_value: row.option2_value || undefined,
      option3_name: row.option3_name || undefined,
      option3_value: row.option3_value || undefined,
      variant_price: row.variant_price ? parseFloat(row.variant_price) || undefined : undefined,
      variant_sku: row.variant_sku || undefined,
      variant_stock: row.variant_stock ? Math.min(parseInt(row.variant_stock, 10) || 0, 1000) : undefined,
      variant_compare_at_price: row.variant_compare_at_price ? parseFloat(row.variant_compare_at_price) || undefined : undefined,
    })

    if (!parsed.success) {
      errors.push(`Row ${rowNum}: ${parsed.error.issues.map((e) => e.message).join(", ")}`)
      continue
    }

    const d = parsed.data
    const existing = productMap.get(handle)

    // Build variant options
    const variantOptions: Record<string, string> = {}
    if (d.option1_name && d.option1_value) variantOptions[d.option1_name] = d.option1_value
    if (d.option2_name && d.option2_value) variantOptions[d.option2_name] = d.option2_value
    if (d.option3_name && d.option3_value) variantOptions[d.option3_name] = d.option3_value
    const hasVariant = Object.keys(variantOptions).length > 0

    if (existing) {
      // Additional variant row for an existing product
      if (hasVariant) {
        // Merge option values
        for (const [name, value] of Object.entries(variantOptions)) {
          const opt = existing.options.find((o) => o.name === name)
          if (opt) {
            if (!opt.values.includes(value)) opt.values.push(value)
          } else {
            existing.options.push({ name, values: [value] })
          }
        }
        existing.variants.push({
          options: variantOptions,
          price: d.variant_price ?? d.price,
          compare_at_price: d.variant_compare_at_price ?? null,
          sku: d.variant_sku || null,
          stock: d.variant_stock ?? d.stock ?? null,
          is_available: d.available ?? true,
        })
      }
      // Additional image
      if (d.image_url && !existing.image_url) {
        existing.image_url = d.image_url
      }
    } else {
      // New product
      const product: ParsedProduct = {
        name: d.title,
        description: d.description || null,
        sku: d.sku || null,
        price: d.price,
        compare_at_price: d.compare_at_price || null,
        status: d.status || "active",
        is_available: d.available ?? true,
        stock: d.stock ?? null,
        image_url: d.image_url || null,
        collection: d.collection || null,
        options: [],
        variants: [],
      }

      if (hasVariant) {
        for (const [name, value] of Object.entries(variantOptions)) {
          product.options.push({ name, values: [value] })
        }
        product.variants.push({
          options: variantOptions,
          price: d.variant_price ?? d.price,
          compare_at_price: d.variant_compare_at_price ?? null,
          sku: d.variant_sku || null,
          stock: d.variant_stock ?? d.stock ?? null,
          is_available: d.available ?? true,
        })
      }

      productMap.set(handle, product)
      order.push(handle)
    }
  }

  return { products: order.map((h) => productMap.get(h)!), errors }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  if (!store) return NextResponse.json({ error: "No store found" }, { status: 400 })

  const body = await req.json()
  const rows: Record<string, string>[] = body.rows
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No data rows provided" }, { status: 400 })
  }

  // Parse CSV rows into products
  const { products, errors } = parseRows(rows)
  if (products.length === 0) {
    return NextResponse.json({ error: "No valid products found", errors }, { status: 400 })
  }

  // Check tier limit
  const limit = await checkResourceLimit(supabase, user.id, store.id, "products")
  const remaining = limit.limit === Infinity ? Infinity : limit.limit - limit.current
  if (remaining < products.length) {
    return NextResponse.json({
      error: `You can import up to ${remaining} more products on your current plan. Upgrade to Pro for unlimited products.`,
      errors,
    }, { status: 400 })
  }

  // Resolve collections by name (case-insensitive)
  const collectionNames = [...new Set(products.map((p) => p.collection).filter(Boolean))] as string[]
  const collectionMap = new Map<string, string>()
  if (collectionNames.length > 0) {
    const { data: existingCollections } = await supabase
      .from("collections")
      .select("id, name")
      .eq("store_id", store.id)

    for (const c of existingCollections || []) {
      collectionMap.set(c.name.toLowerCase(), c.id)
    }
  }

  let imported = 0
  const importErrors: string[] = [...errors]

  // Build headers for internal image upload calls
  const uploadHeaders: Record<string, string> = { "Content-Type": "application/json" }
  const cookie = req.headers.get("cookie")
  if (cookie) uploadHeaders.cookie = cookie
  const authorization = req.headers.get("authorization")
  if (authorization) uploadHeaders.authorization = authorization
  const uploadBaseUrl = new URL("/api/upload-images", req.url).toString()

  for (const product of products) {
    // Upload image if provided
    let imageIds: string[] = []
    if (product.image_url) {
      try {
        const uploadRes = await fetch(uploadBaseUrl, {
          method: "POST",
          headers: uploadHeaders,
          body: JSON.stringify({ urls: [product.image_url], storeId: store.id }),
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          imageIds = (uploadData.images || []).map((i: { id: string }) => i.id)
        } else {
          importErrors.push(`"${product.name}": Image upload failed`)
        }
      } catch {
        importErrors.push(`"${product.name}": Image upload failed`)
      }
    }

    const collectionId = product.collection
      ? collectionMap.get(product.collection.toLowerCase()) || null
      : null

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        store_id: store.id,
        name: product.name,
        slug: slugify(product.name),
        description: product.description,
        sku: product.sku,
        price: product.price,
        compare_at_price: product.compare_at_price,
        status: product.status,
        is_available: product.is_available,
        stock: product.stock,
        image_urls: imageIds,
        options: product.options,
        faqs: [],
        collection_id: collectionId,
      })
      .select("id")
      .single()

    if (insertError || !newProduct) {
      importErrors.push(`"${product.name}": ${insertError?.message || "Insert failed"}`)
      continue
    }

    // Insert variants
    if (product.variants.length > 0) {
      const variantRows = product.variants.map((v, i) => ({
        product_id: newProduct.id,
        options: v.options,
        price: v.price,
        compare_at_price: v.compare_at_price,
        sku: v.sku,
        stock: v.stock,
        is_available: v.is_available,
        sort_order: i,
      }))

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantRows)

      if (variantError) {
        importErrors.push(`"${product.name}" variants: ${variantError.message}`)
      }
    }

    imported++
  }

  return NextResponse.json({
    imported,
    total: products.length,
    errors: importErrors,
  })
}
