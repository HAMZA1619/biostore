# r/SaaS Post

**Title:** From 0 to launch: Building an e-commerce SaaS for underserved markets — lessons learned

---

I want to share my journey building Leadivo, an e-commerce platform targeting sellers in markets that Shopify doesn't serve well (MENA, North Africa, emerging markets).

**The problem I noticed:**
- 90%+ of orders in these markets are Cash on Delivery (COD)
- Sellers manage everything through WhatsApp, not email
- Shopify's $39/mo is a lot when your revenue is $300/mo
- No multi-currency support that actually works for small sellers
- In-app browsers (Instagram, TikTok, Snapchat) break most checkout flows

**What I built:**
A multi-tenant storefront platform where each seller gets their own store. Key features:

1. **WhatsApp abandoned checkout recovery** — automatically detects when customers abandon their cart and sends a WhatsApp message with a recovery link
2. **COD-first** — the entire flow assumes cash on delivery
3. **Multi-market pricing** — sell in different countries with auto-converted prices
4. **Mobile-first** — specifically tested in Instagram/TikTok in-app browsers
5. **Arabic + French + English** — fully localized

**Biggest lessons:**
1. Don't build for the market you know — build for the market that needs you
2. WhatsApp > Email for recovery in emerging markets (98% open rate vs 20%)
3. COD creates unique challenges (fake orders, returns) — but it's non-negotiable
4. Keep the storefront fast — these users are on 3G/4G connections

I'm looking for early adopters and feedback. Happy to answer any questions about building for emerging markets.

**Link:** https://www.leadivo.app
