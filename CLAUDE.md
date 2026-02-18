# CLAUDE.md — BioStore Project Rules

## Project Overview

Multi-tenant e-commerce platform built with Next.js 16, React 19, TypeScript, Supabase, and Tailwind CSS 4.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (strict mode)
- **Database & Auth:** Supabase (RLS, SSR client)
- **State Management:** Zustand (persisted cart store)
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style)
- **Forms:** React Hook Form + Zod 4
- **Icons:** Lucide React
- **Notifications:** Sonner

## Project Structure

```
app/
  (auth)/          # Login, signup, OAuth callback
  (dashboard)/     # Protected dashboard routes
  (storefront)/    # Public customer-facing store ([slug])
  api/             # API routes
components/
  ui/              # shadcn/ui primitives
  dashboard/       # Dashboard-specific components
  forms/           # Form components
  layout/          # Layout components (headers, sidebars, footers)
  store/           # Storefront components
  marketing/       # Landing page components
lib/
  supabase/        # Supabase clients (client, server, admin, middleware)
  integrations/    # Integration registry, handlers, and app definitions
  store/           # Zustand stores
  hooks/           # Custom React hooks (use-pixel, use-store-currency, etc.)
  validations/     # Zod schemas
  constants.ts     # App-wide constants (cities, currencies, etc.)
  utils.ts         # Utility functions (cn, formatPrice, slugify, etc.)
supabase/
  migrations/      # Single schema file: 001_initial_schema.sql
```

## Coding Conventions

### Imports

- Always use the `@/` path alias (e.g., `import { cn } from "@/lib/utils"`).
- Never use relative imports like `../../`.

### File Naming

- Components: `kebab-case.tsx` (e.g., `product-form.tsx`)
- Hooks: `use-<name>.ts` (e.g., `use-store-currency.ts`)
- Pages: `page.tsx` inside route directories
- Utilities/libs: `kebab-case.ts`

### Components

- Use `"use client"` directive only when the component needs client-side interactivity.
- Default to React Server Components where possible.
- Style with Tailwind utility classes — no CSS modules.
- Use shadcn/ui components from `@/components/ui/`.

### State Management

- Server data: fetch in Server Components or API routes using Supabase server client.
- Client state: Zustand stores in `lib/store/`.
- Form state: React Hook Form + Zod validation schemas from `lib/validations/`.

### Database / Supabase

- Three Supabase clients exist — use the right one:
  - `lib/supabase/client.ts` — browser/client-side
  - `lib/supabase/server.ts` — Server Components and API routes
  - `lib/supabase/admin.ts` — admin operations (service role key)
- All tables have RLS enabled. Wrap `auth.uid()` in `(select auth.uid())` for performance.
- Keep all schema in a single migration file: `supabase/migrations/001_initial_schema.sql`.

### API Routes

- Located in `app/api/`.
- Use `createClient` from `@/lib/supabase/server` for auth-aware queries.
- Return `NextResponse.json()` with appropriate status codes.

### Validation

- Define Zod schemas in `lib/validations/`.
- Validate on both client (forms) and server (API routes).

### Styling

- Tailwind CSS 4 with CSS custom properties (OKLch color space).
- Dark mode supported via `next-themes` and `.dark` class.
- Use `cn()` from `@/lib/utils` to merge class names.

## Database Change Workflow

When a database schema change is needed:

1. **Update the single schema file** — edit `supabase/migrations/001_initial_schema.sql` to reflect the new state (add columns, tables, policies, etc. inline).
2. **Provide an ALTER SQL block** — after updating the schema file, always output a separate SQL snippet (ALTER TABLE, DROP/CREATE POLICY, etc.) that the user can copy-paste and run in the Supabase SQL Editor to apply the change to the live database.
3. **Never create new migration files** — all schema lives in `001_initial_schema.sql`.

## Integrations System

Third-party integrations are managed via the `store_integrations` table and a registry pattern.

### Architecture

```
lib/integrations/
  registry.ts        # AppDefinition interface + APPS registry
  handlers.ts        # Event dispatcher (e.g. order.created → handler)
  apps/
    whatsapp.ts      # WhatsApp notification app definition + handler
    meta-capi.ts     # Meta Conversions API app definition + handler
components/dashboard/
  integration-manager.tsx              # Install/uninstall + toggle UI
  integrations/
    whatsapp-setup.tsx                 # WhatsApp config dialog
    meta-capi-setup.tsx                # Meta CAPI config dialog
app/api/integrations/
  route.ts                             # CRUD for store_integrations
  whatsapp/connect/route.ts            # WhatsApp OAuth connect
  whatsapp/disconnect/route.ts         # WhatsApp disconnect
  whatsapp/status/route.ts             # WhatsApp status check
```

### Adding a New Integration

1. Create an app definition in `lib/integrations/apps/<name>.ts` implementing `AppDefinition`.
2. Register it in `lib/integrations/registry.ts` → `APPS`.
3. If `hasCustomSetup: true`, create a setup component in `components/dashboard/integrations/`.
4. Add event handler logic in `lib/integrations/handlers.ts` if it reacts to events.

### Meta CAPI / Facebook Pixel

- **Pixel ID lives in `store_integrations` config** (not the `stores` table).
- The storefront layout (`app/(storefront)/[slug]/layout.tsx`) queries `store_integrations` for `meta-capi` config to load the pixel.
- Config shape: `{ pixel_id, access_token, test_event_code?, test_mode }`.
- `test_mode` is auto-set to `true` when `test_event_code` is provided on save, `false` when removed.

### Client-Side Pixel Tracking

- `lib/hooks/use-pixel.ts` — `usePixel()` hook returns a `track(eventName, data)` function that safely calls `window.fbq()`.
- Supported client-side events:
  - **ViewContent** — fired on product page load (`components/store/pixel-view-content.tsx`)
  - **AddToCart** — fired in `add-to-cart-button.tsx` and `variant-selector.tsx`
  - **InitiateCheckout** — fired on cart page load (`app/(storefront)/[slug]/cart/page.tsx`)
- **Purchase** — server-side only via Meta Conversions API (`lib/integrations/apps/meta-capi.ts`), triggered by `order.created` event.

## Integration Sync Rule

When adding or modifying order-related fields (columns on the `orders` table, payload fields in the `handle_order_created` trigger), always check and update the integrations that consume order data:

- **Google Sheets** (`lib/integrations/apps/google-sheets.ts`) — add the new field to `AVAILABLE_FIELDS`, `EventPayload`, and the `getOrderFieldValue` switch so users can optionally include it in their spreadsheet.
- **WhatsApp** (`lib/integrations/apps/whatsapp.ts`) — update `EventPayload`, the AI prompt context string, and the fallback `buildWhatsAppMessage` function so the new data appears in customer notifications when relevant.
- **Meta CAPI** (`lib/integrations/apps/meta-capi.ts`) — update `EventPayload` if the field is relevant to Facebook conversion tracking (e.g. value, currency, content data).

In short: any new order field must flow end-to-end — schema → trigger payload → integration `EventPayload` → handler logic.

## Responsive UI

- All UI must work on mobile (320px) first, then scale up — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`).
- Use `flex-wrap` on rows that contain multiple actions (buttons, badges) so they stack instead of overflowing.
- Avoid fixed widths — prefer `w-full`, `max-w-*`, `min-w-0`, and `flex-1`.
- Use responsive font sizes when needed (e.g., `text-xl sm:text-2xl`).
- Long text (URLs, labels) must truncate or wrap — use `truncate`, `break-all`, or `line-clamp-*`.
- Grids should adapt: e.g., `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, never hardcode 3+ columns without a mobile fallback.
- Fixed/sticky floating elements (buttons, toasts) must not overlap each other — offset them vertically.
- Test storefront components at 320px (mobile preview) since that's the primary target.

## Don'ts

- Don't create new migration files — modify the single `001_initial_schema.sql`.
- Don't use bare `auth.uid()` in RLS policies — always use `(select auth.uid())`.
- Don't install new dependencies without asking first.
- Don't add comments, docstrings, or type annotations to code you didn't change.
- Don't over-engineer — keep changes minimal and focused on what was asked.
