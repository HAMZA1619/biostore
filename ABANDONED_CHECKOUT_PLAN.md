# Abandoned Checkout Recovery Plan

## Context

Customers who start filling the checkout form but leave without ordering are lost. Currently there's no server-side tracking of checkout intent — the cart is purely client-side (Zustand + localStorage). This feature captures checkout sessions when a customer enters their phone number, then triggers recovery across **3 integrations**:

- **WhatsApp** — Send a recovery message to bring the customer back
- **Meta CAPI** — Fire server-side `InitiateCheckout` event for retargeting audiences
- **Google Sheets** — Log abandoned checkouts to a spreadsheet for tracking

## Architecture

```
Customer enters phone on cart page
  → onBlur fires POST /api/checkout-sessions (non-blocking)
  → Upserts row in abandoned_checkouts table
  → Customer leaves without ordering
  → Supabase pg_cron (every 30 min) calls recovery API endpoint
  → Finds pending sessions > 30 min old with no matching order
  → For each abandoned checkout:
      → WhatsApp: sends recovery message via Evolution API
      → Meta CAPI: fires InitiateCheckout event to Facebook Conversions API
      → Google Sheets: appends row to spreadsheet (opt-in, disabled by default)
  → When customer orders later, marks checkout as "recovered"
```

---

## Scheduling: Supabase pg_cron + pg_net (Free Tier Compatible)

Vercel Hobby (free) plan only allows cron jobs once per day — too slow for 30-minute recovery. Instead, use **Supabase pg_cron + pg_net** which are both available on the free plan.

### Prerequisites

Before running the SQL below, enable these extensions in the **Supabase Dashboard → Database → Extensions**:
1. Search for **pg_cron** → Enable it
2. Search for **pg_net** → Enable it

These must be enabled from the dashboard first — `CREATE EXTENSION` alone won't work if they're not enabled.

### Setup (run in Supabase SQL Editor)

```sql
-- Enable extensions (must be enabled in Supabase Dashboard first!)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule recovery check every 30 minutes (free tier friendly)
SELECT cron.schedule(
  'recover-abandoned-checkouts',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL/api/cron/abandoned-checkouts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace `YOUR_APP_URL` with your production URL and `YOUR_CRON_SECRET` with a secure random string.

### Manage the cron job

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule
SELECT cron.unschedule('recover-abandoned-checkouts');

-- View run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

---

## Files to Modify/Create

### 1. `supabase/migrations/001_initial_schema.sql` — New table

Add `abandoned_checkouts` table with:
- store_id, customer_phone, customer_name, customer_email, customer_country, customer_city, customer_address
- cart_items (JSONB), subtotal, total, currency
- status: `pending | sent | recovered | expired`
- recovered_order_id (nullable FK to orders)
- sent_at, recovered_at, created_at, updated_at

Indexes:
- Partial unique on `(store_id, customer_phone) WHERE status IN ('pending', 'sent')` — enables upsert
- Status + created_at for cron queries

RLS policies:
- Owners can SELECT/UPDATE their store's abandoned checkouts
- Anyone can INSERT for published stores (storefront is unauthenticated)

SECURITY DEFINER function `upsert_abandoned_checkout()` for atomic upsert (handles ON CONFLICT with partial index).

### 2. `app/api/checkout-sessions/route.ts` — NEW

Public POST endpoint called from cart page:
- Validates: slug, customer_phone (required), cart_items (non-empty)
- Looks up store by slug (must be published)
- Calls `supabase.rpc('upsert_abandoned_checkout', { ... })`
- Returns `{ ok: true }` — no sensitive data returned

### 3. `app/(storefront)/[slug]/cart/page.tsx` — Modify

- Add `onBlur` on the phone input field → calls `saveCheckoutSession()`
- Add debounced `useEffect` (5s delay) that re-saves when form/cart changes (only if phone is entered)
- `saveCheckoutSession()` is fire-and-forget (non-blocking, silently catches errors)
- Sends: slug, phone, name, email, address, city, country, cart_items, subtotal, total

### 4. `lib/integrations/registry.ts` — Modify

Add `"checkout.abandoned"` to `IntegrationEventType` union type:
```typescript
export type IntegrationEventType = "order.created" | "order.status_changed" | "checkout.abandoned"
```

### 5. `lib/integrations/apps/whatsapp.ts` — Modify

- Add `AbandonedCheckoutPayload` interface (shared across all 3 integrations)
- Add `checkout.abandoned` to `events` array in app definition
- Add AI system prompt for recovery messages (localized en/fr/ar)
- Add fallback `buildWhatsAppMessage` case for `checkout.abandoned`
- Message includes: customer name, cart items, total, store link

### 6. `lib/integrations/apps/meta-capi.ts` — Modify

Add `checkout.abandoned` support to fire a server-side **InitiateCheckout** event:

- Add `checkout.abandoned` to `events` array in app definition
- In `handleMetaCAPI()`, add a case for `checkout.abandoned`:
  - `event_name`: `"InitiateCheckout"`
  - `user_data`: Hash customer phone (using existing `hashSHA256` + `normalizePhoneForHash`), hash first/last name, hash city, resolve country ISO
  - `custom_data`:
    ```json
    {
      "value": checkout.total,
      "currency": checkout.currency,
      "content_type": "product",
      "contents": [
        { "id": "product-name", "quantity": 1, "item_price": 29.99 }
      ],
      "num_items": 3
    }
    ```
- This enables:
  - Facebook retargeting audiences (people who initiated checkout but didn't purchase)
  - Funnel analytics: ViewContent → AddToCart → InitiateCheckout → Purchase
  - Lookalike audiences based on high-intent users

### 7. `lib/integrations/apps/google-sheets.ts` — Modify

Add **optional** `checkout.abandoned` support (disabled by default):

- Add `checkout.abandoned` to `events` array in app definition
- Add `track_abandoned_checkouts` boolean to `GoogleSheetsConfig` (default: `false`)
- Add new fields to `AVAILABLE_FIELDS`:
  ```typescript
  { key: "event_type", defaultHeader: "Event" }        // "Order" or "Abandoned"
  { key: "checkout_status", defaultHeader: "Recovery" } // "pending", "sent", "recovered", "expired"
  ```
- Update `getOrderFieldValue()` to handle the new fields
- In `google-sheets.server.ts`, update `handleGoogleSheets()`:
  - For `checkout.abandoned`: check `config.track_abandoned_checkouts === true`, skip if false
  - Format rows the same way as orders (payload shape matches)
  - Add `event_type` field value: returns `"Abandoned Checkout"` for `checkout.abandoned`, `"Order"` for `order.created`
  - Add `checkout_status` field value: returns the abandoned checkout status

#### Google Sheets Setup UI — Add toggle

In `components/dashboard/integrations/google-sheets-setup.tsx`, add a toggle:
- Label: "Track abandoned checkouts" / hint: "Log abandoned checkouts alongside orders in your spreadsheet"
- Saves `track_abandoned_checkouts: boolean` to config
- Default: `false` (disabled)

### 8. `lib/integrations/handlers.ts` — Modify

Update `dispatchSingle()` to route `checkout.abandoned` events to all 3 handlers. Currently it already routes by `integration.integration_id`, and each handler checks `eventType` internally. The main change is that Meta CAPI and Google Sheets handlers need to accept `checkout.abandoned` (remove their `order.created`-only guards).

### 9. `app/api/cron/abandoned-checkouts/route.ts` — NEW

POST endpoint secured with `CRON_SECRET` header (called by Supabase pg_cron via `net.http_post`):

1. Query `abandoned_checkouts` where status = 'pending', updated_at > 30 min ago, created_at < 24 hours
2. For each checkout, fetch the store's enabled integrations
3. **Dispatch to all enabled integrations** (not just WhatsApp):
   - **WhatsApp** (if enabled): Send recovery message
   - **Meta CAPI** (if enabled): Fire `InitiateCheckout` server-side event
   - **Google Sheets** (if enabled): Append abandoned checkout row
4. If no integrations are enabled → mark as "expired"
5. Update status to "sent", log to `integration_events` table
6. Expire old checkouts (> 48 hours)
7. `maxDuration = 60`, batch limit of 50

### 10. `app/api/orders/route.ts` — Modify

After order creation, check for matching abandoned_checkout (same store_id + customer_phone, status pending/sent). If found, update to "recovered" with recovered_order_id. Uses admin client (non-blocking, wrapped in try/catch).

### 11. `app/(dashboard)/dashboard/page.tsx` — Modify

Add a recovery stats card: `{recoveredCount}/{totalAbandoned}` with recovery rate %.

### 12. Dashboard abandoned checkouts page (optional)

- `app/(dashboard)/dashboard/abandoned-checkouts/page.tsx` — List page
- `components/dashboard/abandoned-checkouts-table.tsx` — Table with status badges
- `components/layout/dashboard-sidebar.tsx` — Add nav item

### 13. Locale files — Add translation keys

Add keys for: `nav.abandonedCheckouts`, `dashboard.recoveredCheckouts`, table headers, status labels.

---

## Shared Payload: `AbandonedCheckoutPayload`

Used by all 3 integrations in the cron endpoint:

```typescript
interface AbandonedCheckoutPayload {
  // Customer info (same field names as order EventPayload)
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_country?: string
  customer_city?: string
  customer_address?: string
  // Cart data
  cart_items: Array<{
    product_name: string
    product_price: number
    quantity: number
    variant_options?: string | null
  }>
  subtotal: number
  total: number
  currency: string
  // Store context
  store_name: string
  store_url: string
  // Metadata
  abandoned_checkout_id: string
  status: string
  created_at: string
}
```

This maps cleanly to each integration's existing payload expectations:
- **WhatsApp**: Uses customer_name, phone, cart_items, total, store_url for message
- **Meta CAPI**: Uses phone, name, city, country for user_data; total, currency, cart_items for custom_data
- **Google Sheets**: Maps to existing AVAILABLE_FIELDS (customer_name → "Customer", total → "Total", etc.)

---

## Meta CAPI: InitiateCheckout Event Detail

The Facebook Conversions API payload sent for each abandoned checkout:

```json
{
  "data": [{
    "event_name": "InitiateCheckout",
    "event_time": 1234567890,
    "action_source": "website",
    "user_data": {
      "ph": ["sha256(normalized_phone)"],
      "fn": ["sha256(first_name)"],
      "ln": ["sha256(last_name)"],
      "ct": ["sha256(city)"],
      "country": ["sha256(country_iso)"]
    },
    "custom_data": {
      "value": 150.00,
      "currency": "MAD (dynamic from store currency)",
      "content_type": "product",
      "num_items": 3,
      "contents": [
        { "id": "Product Name", "quantity": 2, "item_price": 50.00 },
        { "id": "Other Product", "quantity": 1, "item_price": 50.00 }
      ]
    }
  }]
}
```

Reuses existing functions from `meta-capi.ts`:
- `hashSHA256()` for PII hashing
- `normalizePhoneForHash()` for phone normalization
- `resolveCountryISO()` for country code conversion

---

## Google Sheets: New Fields

Two new fields added to `AVAILABLE_FIELDS` so store owners can optionally include them in their spreadsheet:

| Field Key | Default Header | Value for Orders | Value for Abandoned Checkouts |
|-----------|---------------|------------------|-------------------------------|
| `event_type` | Event | `Order` | `Abandoned Checkout` |
| `checkout_status` | Recovery | _(empty)_ | `pending` / `sent` / `recovered` / `expired` |

All existing fields (customer_name, phone, total, items, etc.) work for both event types since the payload uses the same field names.

---

## ALTER SQL (run in Supabase SQL Editor)

```sql
-- ===================================================
-- STEP 1: Create the abandoned_checkouts table
-- ===================================================

CREATE TABLE abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_country TEXT,
  customer_city TEXT,
  customer_address TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'recovered', 'expired')),
  recovered_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique: one active checkout session per store+phone
CREATE UNIQUE INDEX idx_abandoned_checkouts_store_phone
  ON abandoned_checkouts(store_id, customer_phone)
  WHERE status = 'pending' OR status = 'sent';

-- For cron queries: find pending checkouts efficiently
CREATE INDEX idx_abandoned_checkouts_store ON abandoned_checkouts(store_id);
CREATE INDEX idx_abandoned_checkouts_status ON abandoned_checkouts(status, created_at)
  WHERE status = 'pending';

-- ===================================================
-- STEP 2: RLS policies
-- ===================================================

ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Store owners can read their abandoned checkouts (dashboard)
CREATE POLICY "Owners can view abandoned checkouts" ON abandoned_checkouts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = abandoned_checkouts.store_id
    AND stores.owner_id = (select auth.uid())
  ));

-- Store owners can update (for dashboard management)
CREATE POLICY "Owners can update abandoned checkouts" ON abandoned_checkouts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = abandoned_checkouts.store_id
    AND stores.owner_id = (select auth.uid())
  ));

-- Storefront visitors can create (no auth, store must be published)
CREATE POLICY "Anyone can create abandoned checkouts" ON abandoned_checkouts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = abandoned_checkouts.store_id
    AND stores.is_published = true
  ));

-- ===================================================
-- STEP 3: Upsert function (SECURITY DEFINER)
-- ===================================================

CREATE OR REPLACE FUNCTION public.upsert_abandoned_checkout(
  p_store_id UUID,
  p_customer_phone TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_country TEXT DEFAULT NULL,
  p_customer_city TEXT DEFAULT NULL,
  p_customer_address TEXT DEFAULT NULL,
  p_cart_items JSONB DEFAULT '[]',
  p_subtotal DECIMAL DEFAULT 0,
  p_total DECIMAL DEFAULT 0,
  p_currency TEXT
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.abandoned_checkouts (
    store_id, customer_phone, customer_name, customer_email,
    customer_country, customer_city, customer_address,
    cart_items, subtotal, total, currency, status, updated_at
  ) VALUES (
    p_store_id, p_customer_phone, p_customer_name, p_customer_email,
    p_customer_country, p_customer_city, p_customer_address,
    p_cart_items, p_subtotal, p_total, p_currency, 'pending', now()
  )
  ON CONFLICT (store_id, customer_phone)
    WHERE status = 'pending' OR status = 'sent'
  DO UPDATE SET
    customer_name = COALESCE(EXCLUDED.customer_name, abandoned_checkouts.customer_name),
    customer_email = COALESCE(EXCLUDED.customer_email, abandoned_checkouts.customer_email),
    customer_country = COALESCE(EXCLUDED.customer_country, abandoned_checkouts.customer_country),
    customer_city = COALESCE(EXCLUDED.customer_city, abandoned_checkouts.customer_city),
    customer_address = COALESCE(EXCLUDED.customer_address, abandoned_checkouts.customer_address),
    cart_items = EXCLUDED.cart_items,
    subtotal = EXCLUDED.subtotal,
    total = EXCLUDED.total,
    currency = EXCLUDED.currency,
    status = 'pending',
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Allow anonymous (storefront) and authenticated users to call the upsert function
GRANT EXECUTE ON FUNCTION public.upsert_abandoned_checkout TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_abandoned_checkout TO authenticated;

-- ===================================================
-- STEP 4: Schedule cron job (pg_cron + pg_net)
-- ===================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replace YOUR_APP_URL and YOUR_CRON_SECRET before running
SELECT cron.schedule(
  'recover-abandoned-checkouts',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL/api/cron/abandoned-checkouts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## Implementation Order

1. **Schema** — edit `001_initial_schema.sql` + run ALTER SQL in Supabase
2. **API** — create `app/api/checkout-sessions/route.ts`
3. **Cart page** — add onBlur + debounced save to `cart/page.tsx`
4. **Integration types** — add `checkout.abandoned` to `registry.ts`
5. **WhatsApp** — add recovery message generation to `whatsapp.ts`
6. **Meta CAPI** — add `InitiateCheckout` event handling to `meta-capi.ts`
7. **Google Sheets** — add `checkout.abandoned` handling + new fields to `google-sheets.ts` and `google-sheets.server.ts`
8. **Handlers** — update `handlers.ts` dispatch to route `checkout.abandoned` to all 3
9. **Cron endpoint** — create `app/api/cron/abandoned-checkouts/route.ts`
10. **Orders API** — add recovery detection to `orders/route.ts`
11. **pg_cron** — run the cron.schedule SQL in Supabase
12. **Dashboard stats** — add recovery card to `dashboard/page.tsx`
13. **Dashboard page** — abandoned checkouts list + sidebar nav (optional)
14. **Translations** — add i18n keys to en.json, fr.json, ar.json

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `CRON_SECRET` | Vercel + `.env.local` | Secures the cron endpoint |

Generate a secure random string: `openssl rand -hex 32`

---

## Integration Summary

| Integration | Event Fired | Purpose | Existing Functions Reused |
|-------------|------------|---------|--------------------------|
| **WhatsApp** | `checkout.abandoned` | Send recovery message to customer | `handleWhatsApp()`, `generateAIMessage()`, `normalizePhone()` |
| **Meta CAPI** | `InitiateCheckout` | Retargeting audiences + funnel analytics | `handleMetaCAPI()`, `hashSHA256()`, `normalizePhoneForHash()`, `resolveCountryISO()` |
| **Google Sheets** | `checkout.abandoned` | Log abandoned checkouts to spreadsheet **(opt-in, disabled by default)** | `handleGoogleSheets()`, `formatOrderRows()`, `getOrderFieldValue()` |

---

## Verification

- [ ] `npm run build` passes
- [ ] Fill cart, enter phone on cart page → row appears in `abandoned_checkouts`
- [ ] Update form fields → row updates via upsert (debounced)
- [ ] Complete order with same phone → abandoned checkout marked as "recovered"
- [ ] Cron endpoint processes pending sessions:
  - [ ] WhatsApp: sends recovery message
  - [ ] Meta CAPI: fires `InitiateCheckout` event (check Events Manager)
  - [ ] Google Sheets: appends row only if `track_abandoned_checkouts` is enabled in config
- [ ] Dashboard shows recovery stats
- [ ] No impact on normal checkout flow (all saves are non-blocking)
- [ ] pg_cron job runs every 30 minutes (check `cron.job_run_details`)
