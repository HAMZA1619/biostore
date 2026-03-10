import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

export const maxDuration = 120

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
        .select("id, name, slug, currency, description, language, is_published, custom_domain")
        .eq("owner_id", user.id)
        .single()

      if (store) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_status")
          .eq("id", user.id)
          .single()

        const [productsRes, ordersRes, collectionsRes, marketsRes, discountsRes, integrationsRes, abandonedRes] = await Promise.all([
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
          supabase
            .from("collections")
            .select("name")
            .eq("store_id", store.id),
          supabase
            .from("markets")
            .select("name, currency, is_default")
            .eq("store_id", store.id),
          supabase
            .from("discounts")
            .select("code, discount_type, discount_value, is_active")
            .eq("store_id", store.id)
            .limit(20),
          supabase
            .from("store_integrations")
            .select("app_id, is_enabled")
            .eq("store_id", store.id),
          supabase
            .from("abandoned_checkouts")
            .select("id")
            .eq("store_id", store.id)
            .eq("status", "pending")
            .limit(1),
        ])

        systemPrompt = buildStorePrompt(
          store,
          profile,
          productsRes.data || [],
          ordersRes.data || [],
          collectionsRes.data || [],
          marketsRes.data || [],
          discountsRes.data || [],
          integrationsRes.data || [],
          (abandonedRes.data || []).length > 0
        )
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
        signal: AbortSignal.timeout(120000),
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
  return `You are a friendly support assistant for Leadivo, an e-commerce platform that lets anyone create their own online store in minutes.

ABOUT LEADIVO:
- Leadivo is a multi-tenant e-commerce platform.
- Users can sign up for free (14-day Pro trial included) and create their own online store.
- Each store gets a unique link they can share with customers.
- Pricing: Free tier (10 products, basic features) and Pro tier (unlimited products, full features).

PLATFORM FEATURES:
1. **Quick Store Setup** — Create a store in minutes with name, logo, description, and contact info.
2. **Product Management** — Add products with images (up to 20), prices, variants, stock tracking, and availability toggles. Support for product options and SKUs.
3. **Collections** — Organize products into groups (e.g., "New Arrivals", "Sale Items").
4. **Order Management** — Track orders from pending to delivered with full status workflow, bulk status updates, and customer details.
5. **Store Design** (Pro) — Customize colors, banners, 60+ fonts, border radius, button styles, card shadows, layout spacing, and even inject custom CSS. Dark mode supported.
6. **Mobile Responsive** — Stores look great on any device, optimized for 320px mobile screens.
7. **Cash on Delivery** — COD payments with optional WhatsApp order confirmation.
8. **Multi-Language** — Supports 19 languages including English, French, Arabic (with RTL and multiple dialects), Spanish, Portuguese, German, and more.
9. **Custom Domain** — Connect your own domain name with verification.
10. **Analytics** (Pro) — Track store views, revenue, order metrics, and performance by market.
11. **Multi-Market** — Sell to different countries with per-market pricing, currencies, exchange rates, and rounding rules.
12. **Shipping Zones** — Country-level shipping zones with city-level rate overrides and free shipping thresholds.
13. **Discount Codes** — Create percentage or fixed-amount coupons with usage limits, time windows, and market targeting.
14. **Abandoned Checkout Recovery** — Automatically detect and recover abandoned carts via WhatsApp messages.
15. **Integrations:**
    - **WhatsApp** — Automated order notifications, COD confirmation, and abandoned cart recovery with AI-generated multilingual messages.
    - **Meta Conversions API** — Server-side Facebook purchase event tracking + client-side pixel (ViewContent, AddToCart, InitiateCheckout).
    - **TikTok Events API** — Server-side conversion tracking for TikTok ads.
    - **Google Sheets** — Auto-sync orders to spreadsheets with configurable field mapping.
    - **Google Analytics** — GA4 tracking on your storefront.

STEP-BY-STEP SETUP GUIDE:

Step 1 — Create your account:
  - Click "Get Started" or go to /signup.
  - You get a 14-day Pro trial with all features unlocked.

Step 2 — Set up your store (/dashboard/store):
  - Enter your store name, description, and contact info (phone, email).
  - Upload your store logo.
  - Choose your default language and currency.
  - Click "Publish" when you're ready to go live.

Step 3 — Customize your design (/dashboard/store/theme):
  - Upload a banner image for your storefront homepage.
  - Pick your brand colors (primary, accent, background, text).
  - Choose a font that matches your brand from 60+ options.
  - Adjust button styles, border radius, and layout spacing.

Step 4 — Add products (/dashboard/products):
  - Click "Add Product" and fill in the name, description, and price.
  - Upload product images (up to 20 per product).
  - Set stock quantity if you want to track inventory.
  - If your product has sizes/colors, add variants with individual pricing and stock.
  - Set status to "Active" and toggle availability ON.

Step 5 — Organize with collections (/dashboard/collections):
  - Create collections like "New Arrivals", "Best Sellers", or "Sale".
  - Assign products to collections (done when editing a product).
  - Collections show as filter tabs on your storefront.

Step 6 — Configure shipping (/dashboard/shipping):
  - Add a shipping zone for each country you deliver to.
  - Set a default delivery fee for each zone.
  - Optionally add city-level rate overrides (e.g., cheaper for your city).
  - Set a free shipping threshold if you want (e.g., free above 500 MAD).

Step 7 — Set up markets if selling internationally (/dashboard/markets):
  - Create a market per country/region (e.g., "Morocco", "France").
  - Choose the local currency and pricing mode (fixed or auto-convert).
  - Link shipping zones to the right market.

Step 8 — Connect integrations (/dashboard/integrations):
  - **WhatsApp** (recommended): Connect to send automated order notifications, COD confirmations, and abandoned cart recovery messages.
  - **Meta Conversions API**: Add your Facebook Pixel ID and access token for purchase tracking.
  - **TikTok Events API**: Add your pixel code for TikTok ad conversion tracking.
  - **Google Sheets**: Connect your Google account to auto-sync orders to a spreadsheet.
  - **Google Analytics**: Add your GA4 Measurement ID for traffic analytics.

Step 9 — Create discount codes (/dashboard/discounts):
  - Create coupon codes (e.g., "WELCOME10" for 10% off).
  - Set usage limits, time windows, and target specific markets.

Step 10 — Share your store!
  - Your store is live at your unique link (shown in /dashboard/store).
  - Optionally connect a custom domain for a professional look.
  - Share the link on social media, WhatsApp, or anywhere.

Instructions:
- Help visitors understand what Leadivo is and how it works.
- Answer questions about the platform features, pricing, and setup process.
- When explaining how to do something, walk them through it step by step using the guide above.
- Encourage visitors to sign up and try Leadivo.
- Be concise and friendly. Keep responses short (2-4 sentences) unless more detail is needed.
- If asked about something you don't know, say so honestly.`
}

function buildStorePrompt(
  store: {
    name: string
    slug: string
    currency: string
    description: string | null
    language: string | null
    is_published: boolean | null
    custom_domain: string | null
  },
  profile: {
    subscription_tier: string | null
    subscription_status: string | null
  } | null,
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
  }[],
  collections: { name: string }[],
  markets: { name: string; currency: string; is_default: boolean }[],
  discounts: { code: string; discount_type: string; discount_value: number; is_active: boolean }[],
  integrations: { app_id: string; is_enabled: boolean }[],
  hasAbandonedCheckouts: boolean
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

  const collectionsList = collections.length > 0
    ? collections.map((c) => c.name).join(", ")
    : "None yet"

  const marketsList = markets.length > 0
    ? markets.map((m) => `${m.name} (${m.currency}${m.is_default ? ", default" : ""})`).join(", ")
    : "None configured"

  const discountsList = discounts.length > 0
    ? discounts.map((d) => `${d.code}: ${d.discount_value}${d.discount_type === "percentage" ? "%" : ` ${store.currency}`} off${d.is_active ? "" : " (inactive)"}`).join(", ")
    : "None yet"

  const installedIntegrations = integrations.length > 0
    ? integrations.map((i) => `${i.app_id}${i.is_enabled ? "" : " (disabled)"}`).join(", ")
    : "None installed"

  const tier = profile?.subscription_tier || "free"
  const subStatus = profile?.subscription_status || "none"

  return `You are a friendly onboarding and support assistant for Leadivo, an e-commerce platform. You are helping the owner of the store "${store.name}".

CURRENT STORE STATUS:
- Store name: ${store.name}
- Store URL slug: ${store.slug}
- Custom domain: ${store.custom_domain || "Not set"}
- Published: ${store.is_published ? "Yes" : "No"}
- Description: ${store.description || "Not set yet"}
- Currency: ${store.currency}
- Language: ${store.language || "en"}
- Subscription: ${tier} (${subStatus})
- Products: ${products.length}
- Collections: ${collectionsList}
- Orders: ${orders.length}
- Markets: ${marketsList}
- Discounts: ${discountsList}
- Integrations: ${installedIntegrations}
- Abandoned checkouts pending: ${hasAbandonedCheckouts ? "Yes" : "No"}

PRODUCTS:
${productsSummary}

RECENT ORDERS:
${ordersSummary}

SETUP CHECKLIST (use this to guide the user — check marks based on their data above):
${store.description ? "✅" : "⬜"} Step 1 — Store info (/dashboard/store): Add store name, description, logo, contact info, language, and currency.
${store.is_published ? "✅" : "⬜"} Step 2 — Publish store (/dashboard/store): Toggle your store to "Published" so customers can see it.
${"✅"} Step 3 — Design (/dashboard/store/theme)${tier === "free" ? " (Pro)" : ""}: Customize colors, fonts, banner, logo, button styles, and layout.
${products.length > 0 ? "✅" : "⬜"} Step 4 — Add products (/dashboard/products): Create products with name, description, price, images (up to 20), stock, and variants (sizes/colors).
${collections.length > 0 ? "✅" : "⬜"} Step 5 — Organize collections (/dashboard/collections): Group products into collections like "New Arrivals" or "Best Sellers" — they show as tabs on your storefront.
${"⬜"} Step 6 — Configure shipping (/dashboard/shipping): Add shipping zones by country, set delivery fees, add city-level overrides, and set free shipping thresholds.
${markets.length > 0 ? "✅" : "⬜"} Step 7 — Set up markets (/dashboard/markets): Create markets for different countries with their own currency and pricing rules. Link shipping zones to each market.
${integrations.length > 0 ? "✅" : "⬜"} Step 8 — Connect integrations (/dashboard/integrations):
  - WhatsApp: Send automated order notifications, COD confirmations, and abandoned cart recovery messages.
  - Meta Conversions API: Facebook Pixel tracking (ViewContent, AddToCart, InitiateCheckout on client + Purchase on server).
  - TikTok Events API: Server-side conversion tracking for TikTok ads.
  - Google Sheets: Auto-sync orders to a spreadsheet with configurable fields.
  - Google Analytics: Add your GA4 Measurement ID for traffic analytics.
${discounts.length > 0 ? "✅" : "⬜"} Step 9 — Create discounts (/dashboard/discounts): Create coupon codes (percentage or fixed amount) with usage limits, time windows, and market targeting.
⬜ Step 10 — Share your store! Your store link is available at /dashboard/store. Optionally connect a custom domain for a professional URL.

FEATURE REFERENCE:

**Orders** (/dashboard/orders):
- Status workflow: pending → confirmed → shipped → delivered.
- Bulk status updates, customer details, items, delivery info, and totals.

**Abandoned Checkouts** (/dashboard/abandoned-checkouts):
- Carts abandoned for 30+ minutes are auto-detected.
- WhatsApp recovery messages sent automatically (requires WhatsApp integration).

**Analytics** (/dashboard)${tier === "free" ? " (Pro — upgrade to unlock)" : ""}:
- Store views, revenue, order metrics, per-market reporting, date filtering.

**Billing** (/dashboard/settings):
- Subscription: ${tier} plan. Free = 10 products, basic features. Pro = unlimited products, analytics, custom theme, no branding.

Instructions:
- You are helping this store owner set up and run their store. Use the checklist above to see what they've done and what's missing.
- When the user asks how to do something, give clear step-by-step instructions and reference the exact page (e.g., "Go to /dashboard/products and click Add Product").
- Proactively suggest the next uncompleted step from the checklist when appropriate.
- Be concise and friendly. Keep responses short (2-4 sentences) unless the user asks for more detail.
- You can answer questions about their store data (products, orders, collections, markets, discounts, integrations) using the data above.
- If they're on the free tier, mention Pro features when relevant but don't be pushy.
- If you don't know something specific to their business, say so.
- Do not make up data that isn't provided above.`
}
