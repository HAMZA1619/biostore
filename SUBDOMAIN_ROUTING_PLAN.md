# Subdomain-Based Routing Plan

## Goal
Split the single-domain app into subdomains:

| URL | Purpose |
|-----|---------|
| `domain.com` | Landing page, privacy, terms |
| `app.domain.com` | Dashboard + auth (`/dashboard/*`, `/login`, `/signup`) |
| `slug.domain.com` | Storefront (each store gets its own subdomain) |
| `custom-domain.com` | Storefront (existing feature, kept as-is) |

---

## New Environment Variable

Add `NEXT_PUBLIC_ROOT_DOMAIN` (e.g., `biostore.app`). When not set (or `localhost`), falls back to current path-based routing for development.

`NEXT_PUBLIC_APP_URL` stays as-is for production (set to `https://app.biostore.app`).

---

## Vercel Setup (MUST do before deploying)

### 1. Add Wildcard Domain to Vercel Project

In the Vercel dashboard (or via CLI):
- Go to **Project Settings → Domains**
- Add `domain.com` (root domain)
- Add `*.domain.com` (wildcard — covers `app.domain.com` + all store subdomains)

### 2. DNS Configuration — Use Nameservers Method

Vercel wildcard domains **require the Nameservers method** (not A records):
- In your domain registrar, change nameservers to Vercel's:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`
- This gives Vercel full DNS control, enabling wildcard SSL certificates
- **A record method (`76.76.21.21`) does NOT support wildcard subdomains**

### 3. Vercel Environment Variables

Set in Vercel dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_ROOT_DOMAIN=biostore.app
NEXT_PUBLIC_APP_URL=https://app.biostore.app
```

### 4. Vercel Preview Deployments

Preview deploys use `*.vercel.app` URLs. The middleware must handle this:
```typescript
// Skip subdomain routing for Vercel preview deployments
if (hostname.endsWith(".vercel.app")) {
  // Fall through to path-based routing (existing behavior)
}
```

This ensures preview deployments keep working with path-based routing.

### 5. Custom Domains (Existing Feature)

Custom domains added via the Vercel API (`lib/vercel.ts`) continue to work as-is. The middleware already handles them separately before subdomain logic runs.

---

## Files to Modify

### 1. `lib/supabase/middleware.ts` — Core routing logic

Rewrite `isCustomDomainRequest()` to use `ROOT_DOMAIN` instead of `APP_HOSTNAME`:

```typescript
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || ""

function isCustomDomainRequest(hostname: string): boolean {
  if (!ROOT_DOMAIN || hostname === "localhost" || hostname === "127.0.0.1") return false
  // Vercel preview deployments are not custom domains
  if (hostname.endsWith(".vercel.app")) return false
  if (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)) return false
  return true
}

function getSubdomain(hostname: string): string | null {
  if (!ROOT_DOMAIN || !hostname.endsWith(`.${ROOT_DOMAIN}`)) return null
  const sub = hostname.slice(0, -(ROOT_DOMAIN.length + 1))
  return sub || null
}
```

New middleware flow:

```
1. Custom domain? → existing custom domain logic (unchanged)
   - BUT: skip rewrite for /api/* paths (bug fix)

2. No ROOT_DOMAIN set / localhost / *.vercel.app?
   → fall through to existing path-based logic (dev mode + preview deploys)

3. Extract subdomain from ROOT_DOMAIN:
   a. No subdomain / "www" → root domain
      - Allow: /, /privacy, /terms, /api/*, static assets
      - Block: /dashboard/* → redirect to app.ROOT_DOMAIN/dashboard
      - Block: /login, /signup → redirect to app.ROOT_DOMAIN/login
      - Other paths (e.g. /mystore): redirect to mystore.ROOT_DOMAIN
        (prevents storefronts from rendering on the root domain via [slug] route)

   b. "app" subdomain → dashboard + auth
      - Run existing Supabase auth middleware (session refresh, cookie handling)
      - Redirect authenticated /login|/signup → /dashboard
      - Redirect unauthenticated /dashboard/* → /login
      - Allow: /auth/callback (OAuth flow), /api/* (API routes)
      - Block: storefront paths (e.g. /mystore) → redirect to mystore.ROOT_DOMAIN

   c. Any other subdomain → store slug
      - Skip /api/* paths (don't rewrite, let API routes handle normally)
      - If path starts with /{subdomain}, strip and redirect (same as custom domains)
      - Rewrite /{path} → /{subdomain}/{path} internally
      - Set x-custom-domain: true and x-store-slug headers
```

### 2. `lib/utils.ts` — Add `getStoreUrl()` utility

```typescript
export function getStoreUrl(slug: string, customDomain?: string | null, domainVerified?: boolean): string {
  if (customDomain && domainVerified) return `https://${customDomain}`
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (rootDomain && rootDomain !== "localhost")
    return `https://${slug}.${rootDomain}`
  return `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`
}
```

### 3. `app/(dashboard)/dashboard/page.tsx` — Store link

Update the store link (line 47-54) to use `getStoreUrl()`:
```typescript
// href: getStoreUrl(store.slug, store.custom_domain, store.domain_verified)
// display text: same URL without protocol
```

### 4. `components/forms/store-form.tsx` — Store URL display

Update the URL prefix display (around line 209) to show `slug.domain.com` format:
```
Instead of: domain.com/[slug-input]
Show:       [slug-input].domain.com
Fallback:   domain.com/[slug-input] (when no ROOT_DOMAIN)
```

This requires flipping the input layout when ROOT_DOMAIN is set.

### 5. `app/layout.tsx` — Metadata base URL

Use `ROOT_DOMAIN` for the canonical base:
```typescript
const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://biostore.app"
```

### 6. `app/robots.ts` and `app/sitemap.ts`

Use root domain for base URL (same pattern as layout.tsx).

### 7. `app/api/checkout/route.ts` — Success URL

Line 35: `success_url` already redirects to `/dashboard/settings` — this stays on `NEXT_PUBLIC_APP_URL` which will be `app.domain.com`. **No change needed.**

### 8. Dashboard internal links

Links to `/login`, `/signup` are relative on `app.domain.com`. **No change needed.**

---

## What Does NOT Need to Change

- **Auth cookies**: Auth only happens on `app.domain.com`. No cross-subdomain auth needed (storefronts are public).
- **OAuth callback** (`app/(auth)/auth/callback/route.ts`): Uses `new URL(request.url).origin` (server-side) which will be `https://app.domain.com` — correct. **Note:** You must update the OAuth redirect URI in Supabase Dashboard → Authentication → URL Configuration to use `https://app.domain.com` instead of the old URL.
- **Storefront components**: Product card, collection tabs, search use `/${storeSlug}/...` links. On subdomains, the middleware redirect (strip slug prefix) handles this — same pattern already used by custom domains.
- **`useBaseHref()` hook**: Already reads `data-base-href` attribute. On subdomains, `x-custom-domain: true` makes layout set `baseHref = ""`. Works as-is.
- **`FloatingCartButton`, `StoreHeader`**: Already use `baseHref`. No change.
- **Integration callbacks** (Google Sheets): Use `NEXT_PUBLIC_APP_URL` which will be `app.domain.com`. Correct since these are dashboard operations.
- **Vercel custom domain API** (`lib/vercel.ts`): Still used for user custom domains. No change.

---

## Development Mode

When `NEXT_PUBLIC_ROOT_DOMAIN` is not set:
- All subdomain logic is skipped
- Falls back to current path-based routing
- `getStoreUrl()` returns `APP_URL/slug`
- No change to dev workflow

Vercel preview deployments (`*.vercel.app`):
- Detected by hostname check, skip subdomain routing
- Fall back to path-based routing automatically

---

## Implementation Order

1. Add `getStoreUrl()` to `lib/utils.ts`
2. Rewrite `lib/supabase/middleware.ts` with subdomain routing
3. Update dashboard store link (`dashboard/page.tsx`)
4. Update store form URL display (`store-form.tsx`)
5. Update `app/layout.tsx`, `robots.ts`, `sitemap.ts` base URLs
6. Test locally with path-based routing (ensure no regression)
7. Build and verify no errors

## Vercel Deployment Steps (after code changes)

1. Push code to GitHub
2. In Vercel dashboard → Project Settings → Domains:
   - Add `domain.com`
   - Add `*.domain.com` (wildcard)
3. In domain registrar → change nameservers to Vercel:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
4. In Vercel dashboard → Environment Variables:
   - Set `NEXT_PUBLIC_ROOT_DOMAIN=domain.com`
   - Update `NEXT_PUBLIC_APP_URL=https://app.domain.com`
5. In Supabase Dashboard → Authentication → URL Configuration:
   - Update **Site URL** to `https://app.domain.com`
   - Add `https://app.domain.com/auth/callback` to **Redirect URLs**
   - If using OAuth providers (Google, etc.), update their redirect URIs too
6. Redeploy (or auto-deploys on push)
7. Wait for DNS propagation + SSL certificate generation

---

## Verification

- [ ] `npm run build` passes
- [ ] On localhost (no ROOT_DOMAIN): everything works as before with path-based routing
- [ ] Vercel preview deploys (`*.vercel.app`) work with path-based routing
- [ ] `domain.com` serves landing page only
- [ ] `domain.com/dashboard` redirects to `app.domain.com/dashboard`
- [ ] `app.domain.com/dashboard` works with auth
- [ ] `app.domain.com/login` and `/signup` work
- [ ] OAuth login/signup works on `app.domain.com`
- [ ] `slug.domain.com` shows the store's storefront
- [ ] `slug.domain.com/products/{id}` works
- [ ] `slug.domain.com/cart` and checkout work
- [ ] API routes (`/api/*`) work from all subdomains
- [ ] Custom domains (`mycustomdomain.com`) still work as before
- [ ] `domain.com/mystore` redirects to `mystore.domain.com` (not rendered on root)
- [ ] `app.domain.com/mystore` redirects to `mystore.domain.com` (not rendered on app subdomain)
- [ ] Dashboard links show `slug.domain.com` format
- [ ] Wildcard SSL certificate covers all subdomains
- [ ] Supabase OAuth redirect URI updated to `app.domain.com`
