

# Payment Settings — Admin Infrastructure

## Goal
Create a `platform_settings` table and an admin "Payment Settings" panel so you can configure Stripe keys and payment preferences from the dashboard whenever you're ready — no code changes needed later.

## Database

### New table: `platform_settings`
```sql
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  is_secret boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
-- RLS: admin-only read/write
```

Pre-seed with rows:
- `payment_gateway` → `whatsapp` (options: `whatsapp`, `stripe`, `both`)
- `stripe_publishable_key` → null (is_secret: false)
- `stripe_mode` → `test` (options: `test`, `live`)
- `currency` → `USD`
- `whatsapp_purchase_enabled` → `true`

Note: The actual Stripe secret key will be stored as a backend secret (not in this table) when obtained. This table holds only publishable/config values.

## New File: `src/components/dashboard/PaymentSettingsManager.tsx`
Admin panel with:
- **Payment Gateway** toggle: WhatsApp / Stripe / Both
- **Stripe Configuration** section (disabled until gateway includes "stripe"):
  - Publishable Key input
  - Mode toggle (Test/Live)
  - Status indicator (Not configured / Test mode / Live)
- **Currency** selector (USD default, expandable later)
- **WhatsApp Purchase** toggle
- Save button that updates `platform_settings` rows
- Visual status cards showing current config

## Wiring into Admin Dashboard

### `AdminSidebar.tsx`
Add `{ title: "Payments", icon: CreditCard, value: "payments" }` under "Platform Config" group.

### `Dashboard.tsx`
- Add `"payments": ["admin"]` to `tabAccessMap`
- Import `PaymentSettingsManager`
- Add `case "payments": return <PaymentSettingsManager />;`
- Add title mapping `payments: "Payment Settings"`

## Purchase Flow Hook: `src/hooks/usePaymentConfig.ts`
Small hook that reads `platform_settings` for the active gateway:
```ts
export function usePaymentConfig() {
  // Fetches payment_gateway, stripe_publishable_key, stripe_mode, whatsapp_purchase_enabled
  // Returns: { gateway, isStripeConfigured, isLoading }
}
```

## Update `CreditPurchaseSheet.tsx`
- Use `usePaymentConfig()` to decide which purchase flow to show
- If gateway = `whatsapp`: current WhatsApp flow (unchanged)
- If gateway = `stripe`: show "Pay with Card" button (disabled with "Coming soon — configure in admin" message until key is set)
- If gateway = `both`: show both options

This means when you obtain Stripe credentials later, you just paste the publishable key in admin panel and toggle the gateway — the purchase UI adapts automatically.

## Files
| Action | File |
|--------|------|
| Create | `src/components/dashboard/PaymentSettingsManager.tsx` |
| Create | `src/hooks/usePaymentConfig.ts` |
| Edit | `src/components/dashboard/AdminSidebar.tsx` — add Payments nav item |
| Edit | `src/pages/Dashboard.tsx` — add payments tab routing |
| Edit | `src/components/credits/CreditPurchaseSheet.tsx` — use payment config hook |
| Migration | `platform_settings` table + RLS + seed data |

