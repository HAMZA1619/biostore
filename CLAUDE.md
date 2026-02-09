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
  store/           # Zustand stores
  hooks/           # Custom React hooks
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

## Don'ts

- Don't create new migration files — modify the single `001_initial_schema.sql`.
- Don't use bare `auth.uid()` in RLS policies — always use `(select auth.uid())`.
- Don't install new dependencies without asking first.
- Don't add comments, docstrings, or type annotations to code you didn't change.
- Don't over-engineer — keep changes minimal and focused on what was asked.
