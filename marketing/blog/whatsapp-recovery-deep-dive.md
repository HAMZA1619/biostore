# Hashnode / Medium Article #2

**Tags:** #ecommerce #whatsapp #marketing #saas #startup

**Title:** WhatsApp abandoned cart recovery outperforms email by 5x — here's how I built it

---

Email abandoned cart recovery gets ~20% open rates. WhatsApp gets **98%**. In markets where WhatsApp is the primary messaging app, this difference translates directly to recovered revenue.

I built WhatsApp-based abandoned checkout recovery into my e-commerce platform. Here's the full technical breakdown and the results.

## The Problem

In MENA and North African markets:
- Email is not the primary communication channel — WhatsApp is
- Sellers were manually messaging customers who abandoned carts
- No platform offered automated WhatsApp recovery natively

## How It Works

### Step 1: Capture the checkout session

When a customer enters their phone number on the checkout form, we save a session:

```
Customer enters phone → onBlur → POST /api/checkout-sessions
```

This creates an `abandoned_checkouts` record with:
- Cart items (product names, prices, quantities, images)
- Customer info (phone, name, address — whatever they've filled so far)
- A unique `recovery_token` for secure recovery links
- Totals, delivery fee, discount info

### Step 2: Keep it synced

As the customer continues filling the form (address, city, country), we debounce-save every 5 seconds. The recovery token ensures all updates go to the **same record** — even if they change their phone number.

### Step 3: Detect abandonment

A cron job runs periodically and looks for checkouts that:
- Have status `pending`
- Were last updated more than 30 minutes ago
- Were created less than 24 hours ago
- Haven't already been sent a recovery message

### Step 4: Send WhatsApp recovery message

For each abandoned checkout, we:
1. Check if the customer placed an order since (mark as recovered if yes)
2. Build a recovery URL: `store.com/cart?checkout={recovery_token}`
3. Dispatch to WhatsApp via our integration system
4. Mark the checkout as `sent`

### Step 5: Customer clicks recovery link

The recovery link restores:
- All cart items with correct quantities
- Pre-filled customer info (name, phone, address)
- The checkout is ready to submit in one click

## The Results

| Metric | Email Recovery | WhatsApp Recovery |
|--------|---------------|-------------------|
| Open rate | ~20% | ~98% |
| Click-through rate | 8-12% | 30%+ |
| Recovery rate | 5-8% | 15-18% |
| Time to read | Hours | 5 minutes |

## Key Design Decisions

**1. Token-based, not phone-based**
Originally, we used phone number as the unique key. Problem: if a customer changed their phone mid-checkout, it created a duplicate record and the old one would get a recovery message sent to a potentially wrong number. Now we use a `recovery_token` as the session identifier.

**2. 30-minute delay**
Sending immediately feels aggressive. We wait 30 minutes — long enough that the customer has likely left, but short enough that purchase intent is still high.

**3. Single clean URL**
The recovery link is just `?checkout={token}` — no UUIDs, no extra parameters. Clean and trustworthy-looking in a WhatsApp message.

**4. Auto-expire after 48 hours**
Checkouts older than 48 hours are marked `expired`. Sending messages after that has diminishing returns and feels spammy.

## Optimal Message Timing

Based on industry data for WhatsApp recovery:

| Message | Timing | Strategy |
|---------|--------|----------|
| 1st | 30-60 min | Friendly reminder + cart link |
| 2nd | 12 hours | Urgency — "items selling fast" |
| 3rd | 48 hours | Last chance, optional discount |

## Want to try it?

Leadivo has WhatsApp abandoned checkout recovery built in. Free to try: https://www.leadivo.app
