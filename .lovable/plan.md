

# Learning Section — Remaining Fixes

## 1. EnrollmentsManager.tsx — Fix search query bug
The `debouncedSearch` is in the dependency array of `loadEnrollments` but never applied to the Supabase query. Add an `or` filter to search across student name, talent name, and content title when `debouncedSearch` is non-empty.

## 2. EnrollmentsManager.tsx — Add missing KPI cards
Currently only shows "Total Enrollments". Add three more compact KPI cards: Active, Completed, and Cancelled. Compute these from a separate count query (or aggregate from the status filter counts) so they reflect the full dataset, not just the current page.

## 3. EnrollmentsManager.tsx — AlertDialog for bulk actions
The "Mark Active" and "Mark Completed" bulk buttons currently fire immediately. Wrap each in an `AlertDialog` confirmation: "Are you sure you want to mark N enrollments as [status]?"

## 4. BatchContentGenerator.tsx — Fix select width
Line 516: Change `w-44` to `w-full sm:w-44` so the blog category select doesn't clip on 393px screens.

## Files to Change

| File | Changes |
|------|---------|
| `EnrollmentsManager.tsx` | Add search filter to query, add 3 KPI cards (Active/Completed/Cancelled), wrap bulk actions in AlertDialog |
| `BatchContentGenerator.tsx` | Line 516: `w-44` → `w-full sm:w-44` |

No database changes needed.

