

# Enable Built-in Stripe Payments + Admin Payment Dashboard

## Overview

Enable Lovable's built-in Stripe payments, remove the old custom Stripe code, and add a dedicated **Payments Dashboard** for admins to track revenue, successful payments, failed transactions, and export reports.

## What Already Exists

- **CreditsManager** in the admin dashboard tracks credit balances, consumption stats, and service breakdowns — but it does NOT track Stripe payment revenue or checkout sessions.
- Custom Stripe edge functions (`create-checkout`, `stripe-webhook`, `update-stripe-secret`) handle payments today but will be replaced by the built-in system.
- `credit_transactions` table logs purchases with `stripe_purchase` transaction type.

## Plan

### Step 1: Enable Lovable's built-in Stripe payments
Call `enable_stripe_payments` to provision the managed integration with test environment.

### Step 2: Remove custom Stripe edge functions
Delete `create-checkout`, `stripe-webhook`, and `update-stripe-secret` edge functions.

### Step 3: Update frontend payment components
- **CreditPurchaseSheet**: Rewrite to use built-in checkout flow
- **PaymentSettingsManager**: Replace manual key config with a simple status display
- **usePaymentConfig**: Simplify to check built-in Stripe status

### Step 4: Create products
Set up credit bundles (100/$2, 500/$9, 1000/$16, 2500/$37.50) in the built-in product catalog.

### Step 5: Add Admin Payments Dashboard
Create a new **PaymentsAnalytics** component in the admin dashboard with:

1. **Revenue Summary Cards**
   - Total revenue (all-time)
   - Monthly revenue (current month)
   - Total successful transactions count
   - Average transaction value

2. **Payment Transactions Table**
   - Filterable by date range (24h, 7d, 30d, custom)
   - Filterable by status (successful, pending, failed)
   - Columns: User, Amount, Credits, Status, Date, Stripe Session ID
   - Color-coded status badges (green=success, red=failed, yellow=pending)
   - Paginated with 25 rows per page

3. **Revenue Chart**
   - Daily/weekly revenue trend line using recharts (already installed)
   - Toggle between credit purchases vs dollar revenue view

4. **Service Revenue Breakdown**
   - Pie/bar chart showing which credit bundles sell most
   - Percentage split of purchase amounts

5. **CSV Export**
   - Export filtered transactions to CSV for accounting
   - Include all fields: date, user email, amount, credits, status, transaction ID

6. **Real-time Notifications**
   - Admin gets a notification on each successful Stripe payment (already exists in webhook logic, will be preserved)

### Step 6: Wire into Admin Sidebar
Add "Payments" or "Revenue" entry under the Platform Config group in the admin sidebar, linking to the new dashboard section.

## Data Source

All payment data will come from the existing `credit_transactions` table filtered by `transaction_type = 'stripe_purchase'` (or the built-in equivalent). No new database tables needed — the built-in Stripe integration will continue logging to this table via webhook fulfillment.

## Technical Details

- **Revenue charts**: Built with `recharts` (already a dependency)
- **CSV export**: Client-side generation using existing `downloadFile` utility pattern
- **Date filtering**: Uses `date-fns` (already installed)
- **No new database tables**: Queries `credit_transactions` and `talent_credits`
- **Component location**: `src/components/dashboard/PaymentsAnalytics.tsx`

## Files Changed

| Action | File |
|--------|------|
| Delete | `supabase/functions/create-checkout/index.ts` |
| Delete | `supabase/functions/stripe-webhook/index.ts` |
| Delete | `supabase/functions/update-stripe-secret/index.ts` |
| Rewrite | `src/components/credits/CreditPurchaseSheet.tsx` |
| Rewrite | `src/components/dashboard/PaymentSettingsManager.tsx` |
| Update | `src/hooks/usePaymentConfig.ts` |
| **New** | `src/components/dashboard/PaymentsAnalytics.tsx` |
| Update | `src/components/dashboard/AdminSidebar.tsx` |
| Update | `src/pages/Dashboard.tsx` |

