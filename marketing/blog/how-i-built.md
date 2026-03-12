# Hashnode / Medium Article

**Tags:** #nextjs #supabase #saas #ecommerce #webdev

**Title:** How I built a multi-tenant e-commerce platform with Next.js 16 and Supabase

---

Most e-commerce tutorials show you how to build a single store. I needed to build a platform where **thousands of sellers each get their own store** — with custom domains, different currencies, and localized storefronts.

Here's how I architected it.

## The Requirements

- Multi-tenant: each seller gets their own storefront under a slug (`/store-name`)
- Custom domains with SSL
- Multi-currency with automatic price conversion
- Cash on Delivery (COD) as the primary payment method
- WhatsApp-based abandoned checkout recovery
- Arabic (RTL) + French + English
- Must work in Instagram/TikTok in-app browsers

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Server components, dynamic routing, edge-ready |
| Database | Supabase (Postgres) | RLS, real-time, auth, edge functions |
| Auth | Supabase Auth | OAuth + email, SSR-compatible |
| Styling | Tailwind CSS 4 | Utility-first, RTL support, dark mode |
| State | Zustand | Lightweight, persisted cart store |
| Forms | React Hook Form + Zod | Type-safe validation |
| Deployment | Vercel | Automatic previews, edge network |

## Architecture: Multi-Tenancy via Dynamic Routes

Every storefront lives under `app/(storefront)/[slug]/`. The slug is the store identifier:

```
/cool-shoes          → Store "Cool Shoes"
/cool-shoes/product/abc  → Product page
/cool-shoes/cart     → Checkout page
```

This means one Next.js app serves all stores. The `[slug]` layout fetches the store config (theme, currency, language) and provides it to all child pages.

## Database Security: Row Level Security

Every table has RLS enabled. The key patterns:

**Dashboard (authenticated):** Store owners can only see their own data:
```sql
CREATE POLICY "Owners can view orders" ON orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = (select auth.uid())
  ));
```

**Storefront (anonymous):** Public writes go through `SECURITY DEFINER` functions:
```sql
CREATE OR REPLACE FUNCTION upsert_abandoned_checkout(...)
RETURNS TABLE(checkout_id UUID, checkout_token TEXT)
AS $$ ... $$
LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_abandoned_checkout TO anon;
```

This lets the storefront create abandoned checkout records without exposing the table to direct inserts.

## Abandoned Checkout Recovery

This is the most impactful feature. Here's how it works:

1. Customer adds items to cart and goes to checkout
2. When they enter their phone number and blur the field, we save a checkout session via `POST /api/checkout-sessions`
3. The API calls a Postgres function that upserts an `abandoned_checkouts` record with a unique `recovery_token`
4. As the customer continues filling the form (address, city, etc.), we debounce-save updates every 5 seconds using the same recovery token
5. If they change their phone number, the same record gets updated (no duplicates)
6. If they don't complete the order within 30 minutes, a cron job picks it up and dispatches a WhatsApp message via our integration system
7. The message contains a recovery link: `store.com/cart?checkout={recovery_token}`
8. Clicking the link restores their entire cart and pre-fills the form

The recovery token approach means the URL is clean and secure — no UUIDs exposed.

## Multi-Market Pricing

A store can create "markets" (e.g., France, Morocco, Algeria) with:
- Their own currency
- Auto-converted prices using exchange rates + adjustment percentage
- Or manually fixed prices per product
- Configurable rounding rules (round to nearest 10, 100, etc.)

## In-App Browser Fixes

A surprising amount of traffic comes from Instagram, TikTok, and Snapchat in-app browsers. These browsers have bugs:
- Keyboard pushes content off-screen
- Scroll doesn't work properly after focusing an input
- Some CSS features behave differently

We detect the user agent and apply fixes:
```typescript
const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|Snapchat|TikTok/i.test(ua)
if (isInApp) {
  // Add bottom padding on focus, scroll input into view
}
```

## What I'd Do Differently

1. **Start with fewer features.** I built multi-market support before I had 10 users. Should have waited.
2. **Use Postgres sequences for order numbers.** I used `MAX(order_number) + 1` which works but has edge cases under high concurrency.
3. **Test in-app browsers from day one.** I discovered the keyboard bugs late and had to retrofit fixes.

## Try It

Leadivo is free to try: https://www.leadivo.app

If you're building something similar, happy to answer questions in the comments.
