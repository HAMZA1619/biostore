# Twitter/X Thread — Build in Public Launch

---

**Tweet 1 (hook):**
I built a Shopify alternative for markets Shopify ignores.

90% COD. WhatsApp, not email. Arabic storefronts. $15 average orders.

Here's why and how (thread)

---

**Tweet 2:**
The problem:

Shopify charges $39/mo. In MENA/North Africa, many sellers make $200-500/mo.

They need:
- Cash on Delivery (credit cards don't exist for most buyers)
- WhatsApp communication (not email)
- Arabic/French storefronts

No platform does this natively.

---

**Tweet 3:**
So I built Leadivo.

Multi-tenant e-commerce platform where each seller gets their own store.

Tech stack:
- Next.js 16
- Supabase (Postgres + Auth)
- Tailwind CSS 4
- Zustand
- Vercel

---

**Tweet 4:**
The killer feature: WhatsApp abandoned checkout recovery.

Customer enters phone but doesn't order?

30 min later, they get a WhatsApp message with a link to finish.

WhatsApp open rate: 98%
Email open rate: 20%

This alone recovers 15-18% of abandoned carts.

---

**Tweet 5:**
Other features sellers love:

- City-level shipping zones (different rates per city)
- Multi-currency with auto conversion
- Discount codes with per-customer limits
- Mobile-first (works in Instagram/TikTok in-app browsers)
- Full Arabic RTL support

---

**Tweet 6:**
Biggest lesson from building this:

Don't build for the market everyone is fighting over.

Build for the market that's underserved and desperate for a solution.

Low competition > huge TAM

---

**Tweet 7:**
Leadivo is free to try.

If you're a small seller (or know one), check it out: https://www.leadivo.app

If you're a founder building for emerging markets, I'd love to connect. DM open.

#buildinpublic #saas #ecommerce #indiehackers

---

## Standalone Tweets (post these throughout the week)

**Tweet A:**
TIL that Instagram's in-app browser has different keyboard behavior than Safari.

Spent 2 days debugging why checkout forms broke on Instagram.

The fix? Detect the user agent and add 40vh padding when inputs are focused.

Building for mobile-first markets hits different.

**Tweet B:**
WhatsApp abandoned cart recovery vs email:

- WhatsApp open rate: 98% vs email 20%
- WhatsApp click-through: 30%+ vs email 8-12%
- Recovery rate: 15-18% vs 5-8%

If your customers are on WhatsApp, why are you sending emails?

**Tweet C:**
Hot take: if your e-commerce platform doesn't support Cash on Delivery, you're ignoring 80% of the world's population.

**Tweet D:**
Building a multi-tenant SaaS taught me one thing:

Row Level Security in Postgres is not optional. It's the foundation.

Every query is automatically scoped to the authenticated user's data. No middleware needed. No "oops I forgot to filter by tenant_id."

Supabase makes this easy.
