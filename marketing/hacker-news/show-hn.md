# Hacker News — Show HN Post

**IMPORTANT:** HN hates marketing language. Be technical, honest, and direct. No hype words.

---

**Title:** Show HN: Leadivo — E-commerce platform for COD markets with WhatsApp cart recovery

**Text:**

I built an e-commerce platform for markets where most orders are Cash on Delivery and customer communication happens over WhatsApp (MENA, North Africa, parts of Asia/Africa).

Stack: Next.js 16, React 19, Supabase (Postgres + RLS + Auth), Tailwind CSS 4, Zustand for client state, deployed on Vercel.

Interesting technical decisions:

- Abandoned checkout sessions are tracked with a recovery token. When a customer enters their phone number on the checkout form, we upsert a record via a Postgres SECURITY DEFINER function. If they don't complete the order within 30 minutes, a cron job dispatches a WhatsApp message with a recovery link. The token-based approach means changing your phone number mid-checkout updates the same record instead of creating duplicates.

- Multi-tenant storefronts share the same Next.js app with dynamic routing ([slug]). Each store gets its own products, shipping zones, currency, and theme. Market-specific pricing supports both fixed prices and auto-conversion with configurable rounding rules.

- The checkout is specifically tested in in-app browsers (Instagram, TikTok, Snapchat) which have various keyboard and scroll bugs. We detect the user agent and apply padding/scroll fixes.

- Row Level Security (RLS) on all tables. Storefront writes go through SECURITY DEFINER functions callable by the anon role. Dashboard reads are gated by auth.uid() ownership.

- Per-store order numbering uses SELECT MAX(order_number) + 1 with the trigger running before insert, avoiding gaps from sequences.

Would love feedback on the architecture or the product itself.

https://www.leadivo.app
