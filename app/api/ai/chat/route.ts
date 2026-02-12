import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { message, history } = await request.json()

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    let systemPrompt: string

    if (user) {
      const { data: store } = await supabase
        .from("stores")
        .select("id, name, slug, currency, description")
        .eq("owner_id", user.id)
        .single()

      if (store) {
        const [productsRes, ordersRes] = await Promise.all([
          supabase
            .from("products")
            .select("name, price, stock, status, is_available")
            .eq("store_id", store.id)
            .limit(50),
          supabase
            .from("orders")
            .select("order_number, customer_name, status, total, created_at")
            .eq("store_id", store.id)
            .order("created_at", { ascending: false })
            .limit(30),
        ])

        const products = productsRes.data || []
        const orders = ordersRes.data || []

        systemPrompt = buildStorePrompt(store, products, orders)
      } else {
        systemPrompt = buildLandingPrompt()
      }
    } else {
      systemPrompt = buildLandingPrompt()
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Add GROQ_API_KEY to .env.local" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const chatHistory = (history || []).map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })
    )

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message },
    ]

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          stream: true,
          max_tokens: 1024,
        }),
      }
    )

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text()
      const isRateLimit = groqResponse.status === 429
      return new Response(
        JSON.stringify({
          error: isRateLimit
            ? "Rate limit exceeded. Please wait a moment and try again."
            : `AI service error: ${errBody.substring(0, 200)}`,
        }),
        {
          status: isRateLimit ? 429 : 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = groqResponse.body!.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

            for (const line of lines) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const text = parsed.choices?.[0]?.delta?.content
                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // skip unparseable chunks
              }
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    const isRateLimit = message.includes("429") || message.includes("quota")
    return new Response(
      JSON.stringify({
        error: isRateLimit
          ? "Rate limit exceeded. Please wait a moment and try again."
          : message,
      }),
      {
        status: isRateLimit ? 429 : 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

function buildLandingPrompt(): string {
  return `You are a friendly support assistant for BioStore, an e-commerce platform that lets anyone create their own online store in minutes.

ABOUT BIOSTORE:
- BioStore is a multi-tenant e-commerce platform.
- Users can sign up for free and create their own online store.
- Each store gets a unique link they can share with customers.

PLATFORM FEATURES:
1. **Quick Store Setup** — Create a store in minutes with name, logo, description, and contact info.
2. **Product Management** — Add products with images, prices, stock tracking, and availability toggles.
3. **Collections** — Organize products into groups (e.g., "New Arrivals", "Sale Items").
4. **Order Management** — Track orders from pending to delivered, view customer details.
5. **Store Design** — Customize colors, banners, fonts, and layout to match your brand.
6. **Mobile Responsive** — Stores look great on any device.
7. **Cash on Delivery** — Support for COD payments.
8. **Multi-Language** — Supports English, French, and Arabic (with RTL).
9. **Custom Domain** — Connect your own domain name.
10. **Analytics** — Track store views and performance.
11. **Marketing Tools** — Google Analytics and Facebook Pixel integration.

HOW TO GET STARTED:
1. Click "Get Started" or go to /signup to create an account.
2. After signing up, you'll be taken to the dashboard.
3. Set up your store info at /dashboard/store.
4. Add your first products at /dashboard/products.
5. Share your store link with customers!

Instructions:
- Help visitors understand what BioStore is and how it works.
- Answer questions about the platform features, pricing, and setup process.
- Encourage visitors to sign up and try BioStore.
- Be concise and friendly. Keep responses short (2-4 sentences) unless more detail is needed.
- If asked about something you don't know, say so honestly.`
}

function buildStorePrompt(
  store: {
    name: string
    slug: string
    currency: string
    description: string | null
  },
  products: {
    name: string
    price: number
    stock: number | null
    status: string
    is_available: boolean
  }[],
  orders: {
    order_number: number
    customer_name: string
    status: string
    total: number
    created_at: string
  }[]
): string {
  const productsSummary =
    products.length > 0
      ? products
          .map(
            (p) =>
              `- ${p.name}: ${p.price} ${store.currency}, stock: ${p.stock ?? "untracked"}, status: ${p.status}, available: ${p.is_available}`
          )
          .join("\n")
      : "No products yet."

  const ordersSummary =
    orders.length > 0
      ? orders
          .map(
            (o) =>
              `- #${o.order_number} by ${o.customer_name}: ${o.total} ${store.currency}, status: ${o.status}, date: ${o.created_at}`
          )
          .join("\n")
      : "No orders yet."

  return `You are a friendly onboarding and support assistant for BioStore, an e-commerce platform. You are helping the owner of the store "${store.name}".

CURRENT STORE STATUS:
- Store name: ${store.name}
- Store URL slug: ${store.slug}
- Description: ${store.description || "Not set yet"}
- Currency: ${store.currency}
- Products added: ${products.length}
- Orders received: ${orders.length}

PLATFORM FEATURES & HOW TO USE THEM:

1. **Store Setup** (/dashboard/store):
   - Set your store name, description, logo, and contact info.
   - Choose your currency and configure delivery cities.
   - Your public storefront is available at your store's unique link.

2. **Store Design** (/dashboard/store/theme):
   - Customize your store's appearance: colors, banner image, and layout.
   - Changes are reflected immediately on your public storefront.

3. **Products** (/dashboard/products):
   - Add products with name, description, price, images, and stock.
   - Organize products into collections for better navigation.
   - Toggle product availability on/off without deleting.
   - Set product status to draft or active.

4. **Collections** (/dashboard/collections):
   - Group related products together (e.g., "Summer Sale", "New Arrivals").
   - Each collection has a name, description, and image.
   - Assign products to collections when creating or editing them.

5. **Orders** (/dashboard/orders):
   - View and manage incoming orders from customers.
   - Update order status: pending → confirmed → shipped → delivered.
   - See customer details, items ordered, and total amount.

6. **Settings** (/dashboard/settings):
   - Update your account information.
   - Manage your store preferences.

Instructions:
- Guide the user on how to set up and use their store on this platform.
- Give clear, step-by-step directions when asked how to do something.
- If the user's store is missing something (no description, no products, etc.), proactively suggest they set it up.
- Be concise and friendly. Keep responses short (2-4 sentences) unless more detail is needed.
- Reference the specific dashboard page (e.g., "Go to /dashboard/products") when directing users.
- You can answer basic questions about their store data (product count, order count, etc.).
- If you don't know something specific to their business, say so.
- Do not make up data that isn't provided above.`
}
