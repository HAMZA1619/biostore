# Reddit Karma Building: Search Queries + Comment Templates

**Goal:** Build enough karma (50-100+) to post in r/SaaS, r/Entrepreneur, and other subreddits that have karma requirements. Spend 1-2 weeks helping people before promoting anything.

---

## r/shopify — Help sellers with problems you understand

### Search Queries
- `site:reddit.com/r/shopify COD cash on delivery`
- `site:reddit.com/r/shopify abandoned cart recovery`
- `site:reddit.com/r/shopify shipping zones`
- `site:reddit.com/r/shopify Arabic RTL`
- `site:reddit.com/r/shopify Middle East MENA`
- `site:reddit.com/r/shopify too expensive alternative`
- `site:reddit.com/r/shopify WhatsApp`

### Comment Templates

**When someone asks about COD:**
> COD is tricky on Shopify because the whole platform assumes credit card checkout. If your market is mostly cash-based, you'll need to hack around a lot of things — payment capture flow, order confirmation, even the thank-you page logic. Some sellers I know use a COD app from the Shopify store but it's limited. The real issue is that the abandoned cart recovery (email-based) doesn't work well when your customers don't use email — WhatsApp is where they are.

**When someone complains about Shopify pricing:**
> Yeah, $39/mo hits different when your average order is $15-20. A lot of small sellers in emerging markets face this. Some options: start with the Starter plan ($5/mo) if you only need a link-based store, or look into open-source alternatives like Medusa or Saleor if you're technical. The key is matching the platform cost to your margins.

**When someone asks about abandoned cart recovery:**
> Email recovery works okay for markets where people check email. But if your customers are in markets where WhatsApp is the main channel, your email open rates will be terrible (under 10%). WhatsApp messages get 98% open rates. If you can set up WhatsApp-based recovery, you'll see way better results than email for those audiences.

---

## r/ecommerce — Share practical ecommerce knowledge

### Search Queries
- `site:reddit.com/r/ecommerce cash on delivery`
- `site:reddit.com/r/ecommerce emerging markets`
- `site:reddit.com/r/ecommerce Middle East selling`
- `site:reddit.com/r/ecommerce Africa ecommerce`
- `site:reddit.com/r/ecommerce shipping international`
- `site:reddit.com/r/ecommerce WhatsApp marketing`
- `site:reddit.com/r/ecommerce low budget starting`

### Comment Templates

**When someone asks about selling in MENA/Africa:**
> I work in this space. A few things to know: (1) credit card penetration is under 10% in most of these countries, so you need COD support, (2) WhatsApp is the primary communication channel — not email, (3) Instagram and TikTok drive most traffic, and their in-app browsers are buggy, so your checkout needs to work there, (4) shipping is city-based, not zone-based — rates vary per city. It's a different game from US/EU ecommerce but the opportunity is massive.

**When someone asks about reducing cart abandonment:**
> Depends on your market. For Western markets, email sequences work (20% open rate, 5-8% recovery). For markets where WhatsApp is dominant, switch to WhatsApp recovery — 98% open rate, 15-18% recovery rate. The key is reaching customers where they already are. Also, make sure your checkout works in Instagram's in-app browser — a lot of mobile traffic comes from social media and those browsers have quirks.

---

## r/nextjs — Help with technical questions

### Search Queries
- `site:reddit.com/r/nextjs multi-tenant`
- `site:reddit.com/r/nextjs supabase auth`
- `site:reddit.com/r/nextjs dynamic routes`
- `site:reddit.com/r/nextjs middleware`
- `site:reddit.com/r/nextjs app router`
- `site:reddit.com/r/nextjs RLS row level security`

### Comment Templates

**When someone asks about multi-tenant architecture:**
> I built a multi-tenant app with Next.js App Router + Supabase. The approach: each tenant gets a slug, routes are `[slug]/...`, and Supabase RLS handles data isolation at the database level. Key tip: wrap `auth.uid()` in `(select auth.uid())` in your RLS policies — it prevents the function from being re-evaluated per row. For the storefront (public pages), you query by slug and the RLS policies allow public reads on published stores.

**When someone asks about Supabase + Next.js:**
> Use three separate Supabase clients: (1) browser client for client components, (2) server client for Server Components and API routes (uses cookies), (3) admin client with service role key for operations that bypass RLS. The server client is the one most people miss — you need it to maintain the auth session in Server Components.

---

## r/webdev — Share practical dev experience

### Search Queries
- `site:reddit.com/r/webdev mobile browser issues`
- `site:reddit.com/r/webdev in-app browser`
- `site:reddit.com/r/webdev RTL Arabic`
- `site:reddit.com/r/webdev checkout form`
- `site:reddit.com/r/webdev Tailwind CSS`

### Comment Templates

**When someone asks about in-app browser issues:**
> Instagram's in-app browser is a nightmare. It has different keyboard behavior than Safari — the virtual keyboard pushes the viewport instead of resizing it, which breaks fixed-position elements. The fix I found: detect the Instagram user agent and add extra bottom padding (40vh) when inputs are focused. Also, `position: fixed` doesn't work reliably — use `position: sticky` or just scroll the element into view with JS.

**When someone asks about RTL support:**
> Tailwind handles RTL well if you set `dir="rtl"` on the html/body. Use `rtl:` prefix for directional utilities. The tricky parts: (1) icons that imply direction (arrows) need to flip, (2) number inputs still go LTR even in RTL context, (3) border-radius on one side needs to swap. Test with actual Arabic text, not just `dir="rtl"` on English — Arabic text reflows differently.

---

## r/Entrepreneur — Share business insights

### Search Queries
- `site:reddit.com/r/Entrepreneur emerging markets opportunity`
- `site:reddit.com/r/Entrepreneur ecommerce starting`
- `site:reddit.com/r/Entrepreneur SaaS building`
- `site:reddit.com/r/Entrepreneur first customers`
- `site:reddit.com/r/Entrepreneur niche market`

### Comment Templates

**When someone asks about finding a niche:**
> Look for markets where the existing solutions are built for a different audience. Example: most ecommerce platforms assume credit cards + email + English-speaking customers. But 80% of the world doesn't fit that profile. If you can take an existing solution and rebuild it for an underserved market, you skip the "convince people they need this" phase — they already know they need it, they just don't have a good option.

**When someone asks about getting first users with no budget:**
> What worked for me: (1) Find where your users already hang out online — Facebook groups, WhatsApp groups, specific forums, (2) Help people there for 2 weeks without mentioning your product, (3) When you do mention it, frame it as "I built this because I had the same problem" not "check out my product." Also, build in public on Twitter — other founders will amplify you even if they're not your target market.

---

## r/SaaS — Share SaaS building experience

### Search Queries
- `site:reddit.com/r/SaaS pricing emerging markets`
- `site:reddit.com/r/SaaS multi-tenant architecture`
- `site:reddit.com/r/SaaS first users`
- `site:reddit.com/r/SaaS launch strategy`
- `site:reddit.com/r/SaaS Supabase`
- `site:reddit.com/r/SaaS niche down`

### Comment Templates

**When someone asks about pricing for emerging markets:**
> Pricing for emerging markets is completely different. $39/mo (Shopify's price) is a week's revenue for many small sellers in MENA/Africa. You need to either: (1) offer a generous free tier, (2) price based on local purchasing power, or (3) take a transaction fee instead of a subscription. I've seen the most success with freemium + transaction fee — it aligns your revenue with the seller's success.

**When someone asks about tech stack for SaaS:**
> Next.js + Supabase is a solid combo for solo founders. Supabase gives you Postgres + Auth + RLS out of the box, which means you get multi-tenancy at the database level without building it yourself. The main gotcha: learn RLS properly before you start — retrofitting it is painful. Also, use Zustand over Redux for client state — way less boilerplate.

---

## Daily Routine (15-20 min)

1. Open Reddit, go to each subreddit above
2. Sort by "New"
3. Find 2-3 posts where you can genuinely help
4. Write a thoughtful comment (3-5 sentences minimum)
5. Don't mention Leadivo at all during karma building phase
6. Track your karma — most subreddits need 50-100+ to post

## Tips

- Comment karma matters more than post karma for most subreddits
- Longer, more detailed comments get more upvotes
- Reply to the OP's follow-up questions — engagement boosts your comment
- Avoid sounding like a sales pitch even when not mentioning your product
- Be genuinely helpful — this builds your reputation for when you do post about Leadivo
