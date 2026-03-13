# SEO & Content Plan

Global SaaS SEO strategy. Homepage targets worldwide. Country pages (`/dz`, `/ma`, etc.) handle local SEO.

---

## URL Architecture

```
/              → English, global (no country mentions)
/fr            → French, global (targets Francophone world)
/ar            → Arabic, global (targets Arabic-speaking world)
/dz            → Algeria-specific (French default, local keywords, local ecosystem)
/ma            → Morocco-specific
/tn            → Tunisia-specific
/sa            → Saudi Arabia-specific
/eg            → Egypt-specific
/compare/*     → Competitor comparison pages
/blog/*        → Content marketing
/docs/*        → Knowledge base (already exists)
```

**How `hreflang` connects them:**
```
/    → hreflang="en"           (English, any country)
/fr  → hreflang="fr"           (French, any country)
/ar  → hreflang="ar"           (Arabic, any country)
/dz  → hreflang="fr-DZ"        (French, Algeria specifically)
/ma  → hreflang="fr-MA"        (French, Morocco specifically)
/sa  → hreflang="ar-SA"        (Arabic, Saudi specifically)
```

Google uses this to serve the right page: a French user in Canada sees `/fr`, a French user in Algeria sees `/dz`.

---

## Current SEO Audit — What's Already Done

- [x] Root metadata (title template, description, keywords, OG, Twitter cards)
- [x] JSON-LD on homepage (SoftwareApplication, Organization, FAQPage)
- [x] Dynamic sitemap.ts (homepage, docs, legal pages)
- [x] robots.ts (blocks /dashboard, /api, /auth)
- [x] Canonical URLs on all pages
- [x] Security headers in next.config.ts
- [x] Dynamic per-store metadata (title, description, OG image)
- [x] Dynamic per-product metadata (title, images, OG)
- [x] Dashboard excluded from indexing (noindex, nofollow)
- [x] Docs system with category/article structure

---

## High Priority

### 1. Homepage Copy — Global Positioning

The homepage must feel like a **worldwide SaaS** — no mention of any specific country, region, or local ecosystem.
Country-specific SEO lives on dedicated pages (`/dz`, `/ma`, `/sa`, etc.).

**Global keywords for homepage:**
- Primary: "online store builder", "create online store free", "ecommerce platform"
- Secondary: "link in bio store", "social media store", "no-code ecommerce"
- Long-tail: "sell on Instagram without website", "WhatsApp order store", "COD ecommerce platform"
- Social commerce: "sell on TikTok", "sell on Instagram", "social selling platform"

**What to highlight on homepage (global appeal):**
- [ ] Social-to-store value prop (turn followers into customers)
- [ ] No coding, free to start, instant setup
- [ ] WhatsApp orders + COD support (as a global feature, not region-specific)
- [ ] Multi-language stores (20+ languages — show as a feature, not a region)
- [ ] Trust signals: "Used by sellers in X+ countries"
- [ ] Mobile-first storefront design
- [ ] Built-in analytics (COD tracking, order insights)

**What NOT to put on homepage:**
- No country names (Algeria, Morocco, Saudi, etc.)
- No local ecosystem names (delivery companies, local payment providers)
- No "Arabic-first" messaging (say "multi-language" instead)
- No MENA/Africa/region references — keep it universal

### 2. Language Landing Pages (`/fr` + `/ar`)

These are **translated versions of the global homepage** — same universal messaging, different language. No country-specific content.

**`/fr` — French Global Landing Page:**
- [x] Full French translation of homepage (not machine-translated)
- [x] Meta title: "Créez votre boutique en ligne gratuitement | Leadivo"
- [x] Meta description targeting French global keywords: "créer boutique en ligne", "plateforme e-commerce sans code"
- [x] Mirror all JSON-LD structured data in French
- [x] Add to sitemap with priority 0.9
- [x] `hreflang="fr"` (French, no country restriction)

**`/ar` — Arabic Global Landing Page:**
- [x] Full Arabic translation of homepage with RTL layout
- [x] Meta title: "أنشئ متجرك الإلكتروني مجاناً | Leadivo"
- [x] Meta description targeting Arabic global keywords: "إنشاء متجر إلكتروني", "منصة تجارة إلكترونية"
- [x] Mirror all JSON-LD structured data in Arabic
- [x] Add to sitemap with priority 0.9
- [x] `hreflang="ar"` (Arabic, no country restriction)

**Add `hreflang` alternates in root layout metadata:**
```ts
alternates: {
  languages: {
    'en': '/',
    'fr': '/fr',
    'ar': '/ar',
  }
}
```

### 3. Country Landing Pages — Where Local SEO Lives

This is where all country-specific keywords and copy go.
These pages rank for "[country] + ecommerce" searches while the homepage ranks globally.

**Routes (priority order — start with `/dz`):**
- [x] `/dz` — Algeria
- [x] `/ma` — Morocco
- [x] `/tn` — Tunisia
- [x] `/sa` — Saudi Arabia
- [x] `/eg` — Egypt
- [x] `/ae` — UAE

**Each country page should include:**
- Hero with country name: "Create Your Online Store in [Country]"
- Country-specific keywords in meta title/description
- How Leadivo solves problems specific to that market
- Local success stories / testimonials (when available)
- Localized pricing display (local currency)
- Language toggle (EN/FR for `/dz`, EN/AR for `/sa`)
- `hreflang` linking between country variants + global pages
- JSON-LD with `areaServed` for the specific country
- Add to sitemap with priority 0.8

**`/dz` Algeria — Full Keyword Plan (your strongest niche):**

Target keywords:
- EN: "create online store Algeria", "ecommerce platform Algeria", "best online store builder Algeria"
- FR: "créer boutique en ligne Algérie", "plateforme e-commerce Algérie", "vendre en ligne Algérie"
- AR: "إنشاء متجر إلكتروني الجزائر", "أفضل منصة متجر إلكتروني الجزائر"
- Long-tail: "how to sell online in Algeria", "comment vendre en ligne en Algérie"
- COD-specific: "reduce failed deliveries Algeria", "COD analytics Algeria"

Content to include on `/dz`:
- [x] Hero: "Create Your Online Store in Algeria" / "Créez votre boutique en ligne en Algérie"
- [x] Highlight COD analytics ("reduce failed deliveries", "track return rates")
- [x] Mention local delivery ecosystem (Yalidine, EcoTrack, ZR Express, etc.)
- [x] French is the default language (most Algerians search in French)
- [x] Meta title (FR): "Créer une boutique en ligne en Algérie | Leadivo"
- [x] Meta title (EN): "Create Your Online Store in Algeria | Leadivo"
- [x] FAQ section targeting "how to sell online in Algeria" queries
- [x] `hreflang="fr-DZ"` so Google serves this to Algerian users instead of `/fr`

### 4. Web App Manifest (PWA)

**Why:** Improves mobile experience signals, enables "Add to Home Screen", and Google considers PWA signals.

**Action items:**
- [x] Create `public/manifest.json`
- [x] Link manifest in root layout metadata
- [ ] Add `theme-color` meta tag

### 5. Technical SEO Fixes

**Performance (Core Web Vitals):**
- [ ] Audit with Lighthouse — target 90+ on all metrics
- [x] Ensure all images use Next.js `<Image>` with proper `width`, `height`, and `priority` on LCP images
- [ ] Add `fetchPriority="high"` to hero images
- [ ] Lazy load below-fold images and components
- [ ] Preload critical fonts: `<link rel="preload" as="font">`
- [ ] Minimize client-side JS — audit `"use client"` directives, move logic to server where possible
- [x] Enable Next.js `optimizePackageImports` for large libraries (lucide-react, etc.)

**Crawlability:**
- [x] Add `BreadcrumbList` JSON-LD to docs pages for rich navigation snippets
- [x] Add `Product` JSON-LD to storefront product pages (price, availability, images)
- [ ] Ensure all internal links use `<Link>` (not `<a>`) for client-side navigation
- [x] Add `alt` text to every image — audit all `<Image>` components
- [ ] Fix any orphan pages (pages with no internal links pointing to them)

**Indexing:**
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Request indexing for key pages manually after launch
- [ ] Monitor "Coverage" report in GSC for crawl errors
- [ ] Add dynamic store pages to sitemap (top stores by traffic)

**Security headers to add:**
- [x] `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- [ ] Review Content-Security-Policy for any blocked resources

---

## Medium Priority

### 6. Comparison Pages

**Global target keywords:**
- "best ecommerce platform", "Shopify alternative", "free online store builder"
- "Leadivo vs Shopify", "Leadivo vs Wix", "Leadivo vs BigCommerce"
- "best Shopify alternative for social sellers"
- Regional (for country pages to link to): "Leadivo vs Youcan", "Leadivo vs Zid"

**Routes to create:**
- [ ] `/compare` — overview page comparing all platforms
- [ ] `/compare/shopify` — Leadivo vs Shopify (highest search volume)
- [ ] `/compare/wix` — Leadivo vs Wix
- [ ] `/compare/bigcommerce` — Leadivo vs BigCommerce
- [ ] `/compare/youcan` — Leadivo vs Youcan (link from `/dz` and `/ma`)
- [ ] `/compare/zid` — Leadivo vs Zid (link from `/sa`)

**Page structure for each comparison:**
```
1. Hero: "Leadivo vs [Competitor] — Which Is Right for You?"
2. Feature comparison table (pricing, COD support, WhatsApp, multi-language, analytics)
3. Where Leadivo wins (free tier, COD analytics, social selling, multi-language)
4. Where [Competitor] wins (be honest — builds trust and SEO credibility)
5. Who should choose Leadivo vs [Competitor]
6. CTA: "Try Leadivo Free"
7. FAQ section with FAQPage JSON-LD
```

**SEO for comparison pages:**
- [ ] Add `FAQPage` JSON-LD to each comparison page
- [ ] Internal link from homepage features section
- [ ] Add to sitemap with priority 0.7

### 7. Blog / Content Section

**Route:** `/blog`

**Technical setup:**
- [x] Create blog system with MDX or Supabase-backed content
- [x] Dynamic metadata per post (title, description, OG image, author)
- [x] `Article` JSON-LD on each post (author, datePublished, dateModified, publisher)
- [x] Blog index page with pagination
- [x] Category/tag system for organization
- [x] Add blog posts to sitemap dynamically
- [x] RSS feed at `/blog/feed.xml`

**Content calendar — first 10 articles:**

Mix of global articles (rank worldwide) and regional articles (rank locally, link from country pages).

| # | Title | Target Keyword | Audience | Priority |
|---|-------|----------------|----------|----------|
| 1 | How to Start Selling Online in 2026: Complete Guide | "how to start selling online" | Global | High |
| 2 | How to Reduce COD Return Rates | "reduce COD returns ecommerce" | Global (COD markets) | High |
| 3 | How to Turn Your Instagram Into a Store | "sell on Instagram without website" | Global | High |
| 4 | WhatsApp Commerce: The Complete Guide | "WhatsApp ecommerce" | Global | Medium |
| 5 | COD vs Online Payment: Pros and Cons for Sellers | "COD vs online payment ecommerce" | Global | Medium |
| 6 | How to Create a Product Page That Converts | "product page best practices" | Global | Medium |
| 7 | How to Start Ecommerce in Algeria (FR: Comment lancer un e-commerce en Algérie) | "ecommerce Algeria" | `/dz` regional | Medium |
| 8 | TikTok to Store: Convert Followers Into Customers | "sell on TikTok" | Global | Medium |
| 9 | Best Delivery Companies in Algeria (FR: Meilleures entreprises de livraison en Algérie) | "delivery companies Algeria" | `/dz` regional | Low |
| 10 | How to Price Products for COD Markets | "pricing COD ecommerce" | Global | Low |

**Content guidelines:**
- Global articles in English only (unless high-volume French/Arabic keyword exists)
- Regional articles in English + local language (FR for Algeria, AR for Saudi)
- 1500–2500 words per article
- Include at least 2 internal links to product features or docs
- Include a CTA at the end ("Start your free store on Leadivo")
- Add table of contents for articles over 1500 words
- Regional blog posts should link to corresponding country page (`/dz`, `/ma`, etc.)

### 8. Docs SEO Enhancements

**Action items:**
- [x] Add `BreadcrumbList` JSON-LD to all doc pages
- [ ] Add `HowTo` JSON-LD to step-by-step guides
- [x] Ensure docs have unique meta descriptions (not auto-generated)
- [ ] Add search-friendly headings with keywords
- [ ] Internal link from blog articles to relevant docs
- [ ] Add `dateModified` to doc metadata for freshness signals

### 9. Open Graph Image Generation

**Why:** Custom OG images dramatically improve CTR from social shares and search.

**Action items:**
- [ ] Create dynamic OG image generation using `next/og` (ImageResponse API)
- [ ] Route: `app/api/og/route.tsx`
- [ ] Generate branded images with: page title, Leadivo logo, gradient background
- [ ] Use for: homepage, blog posts, comparison pages, docs
- [ ] Template variants:
  - Blog post: title + author + reading time
  - Comparison: "Leadivo vs X" with both logos
  - Docs: category icon + article title

---

## Low Priority

### 10. Customer Testimonials / Case Studies

**Target:** "is Leadivo legit", "Leadivo reviews"

**Action items:**
- [ ] Create `/customers` or `/success-stories` route
- [ ] Collect 5-10 real testimonials from active stores
- [ ] Include: store name, niche, results (orders, revenue growth)
- [ ] Add `Review` JSON-LD schema with aggregate rating
- [ ] Feature top testimonials on homepage
- [ ] Add video testimonials if possible (YouTube embeds — also helps YouTube SEO)

### 11. Link Building Strategy

**Action items:**
- [ ] Submit to SaaS directories: G2, Capterra, Product Hunt, AlternativeTo
- [ ] Submit to ecommerce/tech blogs for reviews
- [ ] Guest post on business/tech blogs in target markets
- [ ] Create a "Made with Leadivo" badge that links back (for storefronts)
- [ ] Create shareable resources (infographics about COD ecommerce, social selling stats)
- [ ] Answer Quora/Reddit questions about ecommerce with links

### 12. Local SEO

**Action items:**
- [ ] Create Google Business Profile (if applicable)
- [ ] Add `Organization` JSON-LD with address
- [ ] Ensure NAP (Name, Address, Phone) consistency across all listings

---

## Ongoing SEO Practices

### Monthly Tasks
- [ ] Review Google Search Console for new keyword opportunities
- [ ] Check for crawl errors and fix broken links
- [ ] Update sitemap if new pages added
- [ ] Publish at least 2 blog posts
- [ ] Monitor Core Web Vitals and fix regressions
- [ ] Check competitor rankings for target keywords

### Quarterly Tasks
- [ ] Full Lighthouse audit on key pages
- [ ] Update comparison pages with new features
- [ ] Refresh outdated content (update dates, stats, screenshots)
- [ ] Review and update JSON-LD schemas
- [ ] Analyze top-performing content and create similar topics
- [ ] A/B test meta titles/descriptions for CTR improvement

### Tools to Set Up
- [ ] **Google Search Console** — indexing, keywords, errors
- [ ] **Google Analytics 4** — traffic, conversions, user behavior
- [ ] **Bing Webmaster Tools** — secondary search engine coverage
- [ ] **Ahrefs or Semrush** (free tier) — keyword tracking, backlink monitoring
- [ ] **PageSpeed Insights** — Core Web Vitals monitoring
- [ ] **Schema Markup Validator** — test all JSON-LD regularly

---

## Key Differentiators to Push in All Content

| Differentiator | Why It Matters | Competitors Lacking This |
|---------------|---------------|------------------------|
| COD Analytics | Reduce failed deliveries, track return rates | Shopify, Wix, BigCommerce |
| Multi-language Stores | 20+ languages in one store, RTL native | Most support 1-2 languages |
| Mobile-first Storefront | Optimized for mobile shoppers worldwide | Most platforms are desktop-first |
| Social-to-Store | Turn Instagram/TikTok followers into buyers | Requires plugins on competitors |
| No Coding Required | Instant setup, drag-and-drop | WooCommerce requires dev skills |
| WhatsApp Integration | Native order notifications via WhatsApp | Most require third-party tools |
| Free Tier | Start selling with zero upfront cost | Shopify charges from day 1 |

---

## Keyword Research Summary

### Global Keywords (Homepage + `/fr` + `/ar`)
| Keyword | Language | Monthly Volume (est.) | Competition |
|---------|----------|----------------------|-------------|
| online store builder | EN | 50K-100K | High |
| create online store free | EN | 10K-50K | Medium |
| sell on Instagram without website | EN | 5K-10K | Low |
| link in bio store | EN | 5K-10K | Medium |
| no-code ecommerce | EN | 1K-5K | Low |
| WhatsApp order store | EN | 1K-5K | Very Low |
| COD ecommerce platform | EN | 1K-5K | Very Low |
| créer boutique en ligne | FR | 10K-50K | Medium |
| إنشاء متجر إلكتروني | AR | 5K-10K | Medium |
| Shopify alternative | EN | 10K-50K | Medium |

### Algeria Keywords (for `/dz` page + blog only)
| Keyword | Language | Monthly Volume (est.) | Competition |
|---------|----------|----------------------|-------------|
| create online store Algeria | EN | 500-1K | Low |
| créer boutique en ligne Algérie | FR | 1K-5K | Low |
| إنشاء متجر إلكتروني الجزائر | AR | 1K-5K | Low |
| best ecommerce platform Algeria | EN | 100-500 | Low |
| how to sell online in Algeria | EN | 500-1K | Low |
| comment vendre en ligne en Algérie | FR | 500-1K | Low |
| ecommerce Algeria 2026 | EN | 500-1K | Low |

### Brand Keywords (Monitor)
| Keyword | Purpose |
|---------|---------|
| Leadivo | Brand searches — should rank #1 |
| Leadivo reviews | Reputation — needs testimonials page |
| Leadivo vs Shopify | Comparison — needs comparison page |
| is Leadivo legit | Trust — needs social proof |

---

## Implementation Priority Order

1. **Week 1-2:** Technical fixes (manifest, hreflang, BreadcrumbList, HSTS, alt texts)
2. **Week 2-3:** Homepage copy optimization (global keywords) + `/fr` and `/ar` language pages
3. **Week 3-4:** `/dz` Algeria country page + set up blog system
4. **Week 4-5:** Publish first 3 blog posts + comparison pages (Shopify, Wix)
5. **Week 5-6:** Dynamic OG image generation + more country pages (`/ma`, `/sa`)
6. **Week 6-8:** Testimonials + remaining comparison pages + link building
7. **Ongoing:** Blog content (2 posts/month), new country pages, GSC monitoring

---

## Research Sources
- Google Keyword Planner — global + regional volume data
- Ahrefs/Semrush keyword explorer — competition analysis
- Google Search Console data (once set up)
- E-commerce in Algeria 2026 Guide — ecommaps.com
- E-commerce in MENA — Bain & Company
- COD Challenges in MENA — istizada.com
