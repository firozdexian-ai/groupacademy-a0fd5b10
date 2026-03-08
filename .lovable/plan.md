

# Stripe Payment Infrastructure — Implementation Plan

## What Already Exists
- `PaymentSettingsManager` admin UI with gateway, Stripe key, mode, currency fields — **fully wired** to `platform_settings` table
- `usePaymentConfig` hook reading settings and exposing `showStripe`, `isStripeConfigured`
- `CreditPurchaseSheet` with "Pay with Card" button (currently disabled when unconfigured)
- All 5 `platform_settings` rows seeded in DB

## What's Missing
The backend checkout flow: no edge function to create Stripe sessions, no webhook to fulfill payments, and the "Pay with Card" button has no handler.

## Implementation

### 1. `create-checkout` Edge Function
Creates a Stripe Checkout session for a selected credit bundle. Reads `STRIPE_SECRET_KEY` from secrets. Returns a checkout URL that the client redirects to.

- Validates authenticated user via `getClaims()`
- Looks up bundle from request body (credits, price)
- Creates Stripe checkout session with success/cancel URLs
- Stores a pending `credit_transactions` record with Stripe session ID
- Returns `{ url: "https://checkout.stripe.com/..." }`

### 2. `stripe-webhook` Edge Function
Handles `checkout.session.completed` events from Stripe. No JWT required (public endpoint with signature verification).

- Verifies Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`
- On success: credits the user's `talent_credits` balance, updates the pending transaction record
- Sends a notification to the user

### 3. Wire CreditPurchaseSheet
- Add `handleStripeCheckout(credits, price)` that calls `supabase.functions.invoke('create-checkout', ...)`
- Redirect to the returned Stripe checkout URL
- Bundle selection cards route to Stripe when Stripe is active gateway

### 4. Add Stripe Secret Key Input to Admin Panel
- Add a new `platform_settings` row for `stripe_secret_key` (marked `is_secret: true`)
- In `PaymentSettingsManager`, add a masked secret key input field
- The `create-checkout` edge function reads this from DB (or from Supabase secrets)

**Security note**: The Stripe *secret* key will be stored as a Supabase secret (not in `platform_settings`) since it must never be exposed client-side. The admin panel will have a "Configure Secret Key" section that calls an edge function to securely store/update it.

### 5. Config + Routing
- Register both new edge functions in `supabase/config.toml`
- Add success/cancel return pages or handle via query params on existing pages

### Files to Create
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

### Files to Edit
- `supabase/config.toml` — register new functions
- `src/components/credits/CreditPurchaseSheet.tsx` — wire Stripe button
- `src/components/dashboard/PaymentSettingsManager.tsx` — add secret key management section
- `.lovable/plan.md` — update progress

### Progress Impact
- **Payments (Stripe)**: 15% → 65% (full flow ready, just needs API key)
- **Overall Platform**: ~76% → ~78%

