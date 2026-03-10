

# Fix Contacts KPI Card Alignment

## Problem
The Contacts tab uses `StatsCard` component which has oversized padding (`p-6` header + `p-6` content) and `text-3xl` values. This causes the KPI cards to be too tall and clip text on mobile at 393px. The Companies tab uses compact inline `Card className="p-3"` cards that fit perfectly.

## Fix
Replace `StatsCard` usage in ContactsManager with the same compact card pattern from CompaniesManager:

**File: `src/components/dashboard/Contacts