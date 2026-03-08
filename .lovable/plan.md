

# Stripe Self-Service Configuration from Admin Panel

## Current State
The Stripe infrastructure is **90% built** — admin UI, checkout, webhook, and purchase flow all exist. The gap: when an admin validates their Stripe keys, the system says "store it as a project secret manually." There's no way to save keys directly from the admin panel.

## What We'll Build

### 1. Store Stripe keys in `platform_settings` (database)
Add two new rows: `stripe_secret_key` and `stripe_webhook_secret`. These are admin-only (RLS-protected) and read by edge functions.

### 2. Update `update-stripe-secret` edge function
Add a `save-key` action that:
- Validates the key against Stripe API
- If valid, saves it to `platform_settings` using the service role client
- Same for webhook secret

### 3. Update `create-checkout` + `stripe-webhook` edge functions
Add fallback: if `STRIPE_SECRET_KEY` env var isn't set, read from `platform_settings` table. Same for webhook secret.

### 4. Update `PaymentSettingsManager.tsx`
- Change "Validate" button to "Validate & Save"
- Add a webhook secret input field
- After successful save, refresh status indicators
- Remove the manual "store it as a project secret" messaging

### Database Migration
```sql
INSERT INTO platform_settings (key, value) VALUES
  ('stripe_secret_key', NULL),
  ('stripe_webhook_secret', NULL)
ON CONFLICT (key) DO NOTHING;
```

### Security
- `platform_settings` is already RLS-protected (admin-only)
- Edge functions use service role to read keys — no client exposure
- Keys are validated against Stripe API before saving
- Admin role check enforced in the edge function

### Files Changed
- `supabase/functions/update-stripe-secret/index.ts` — add `save-key` and `save-webhook` actions
- `supabase/functions/create-checkout/index.ts` — add DB fallback for secret key
- `supabase/functions/stripe-webhook/index.ts` — add DB fallback for webhook secret
- `src/components/dashboard/PaymentSettingsManager.tsx` — validate+save UX, webhook input
- Migration: seed `platform_settings` rows

