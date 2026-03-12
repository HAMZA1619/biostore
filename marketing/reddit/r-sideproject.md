# r/SideProject Post

**Title:** I built a Shopify alternative for small sellers who can't afford $39/mo

---

Hey everyone,

I've been building Leadivo for the past few months — it's a multi-tenant e-commerce platform designed for small sellers, especially in markets where Shopify doesn't really fit (MENA, North Africa, French-speaking countries).

**What it does:**
- Sellers get their own storefront with a custom domain
- Built-in WhatsApp abandoned checkout recovery (sends recovery messages automatically)
- Multi-currency and multi-market support
- Cash on Delivery (COD) — essential in markets where credit cards aren't common
- Automatic shipping zones with city-level delivery fees
- Discount/coupon system with per-customer limits
- Mobile-first design (most customers shop from Instagram/TikTok in-app browsers)

**Tech stack** (for the devs here):
- Next.js 16 + React 19
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS 4
- Zustand for client state
- Deployed on Vercel

**Why I built it:**
Shopify is great but it's expensive for sellers doing $200-500/mo in revenue. In many countries, COD is 90%+ of transactions, and sellers need WhatsApp integration — not email. I wanted to build something that works for those markets natively.

I'd love feedback from anyone here. What would you want to see in a platform like this?

**Link:** https://www.leadivo.app
