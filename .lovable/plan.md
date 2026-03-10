

# Companies Manager — Audit Report

## Current State
788 lines. Server-side paginated with search and industry filter. Includes CRUD dialog, batch import, email outreach with template selection and tracking, outreach history display, and links to jobs/website/LinkedIn. Well-structured code.

---

## Bugs

### 1. Table with 6 columns + action buttons causes horizontal scroll on mobile
Lines 459-603: Table has Company, Industry, Contact, Outreach, Status, Actions columns. The Actions column alone contains up to 6 buttons (email select, website, LinkedIn, jobs, edit, delete). At 391px this forces severe side-scrolling.

### 2. Dialog form uses `grid-cols-2` without responsive breakpoint
Lines 644, 665, 688: Form fields use `grid grid-cols-2 gap-4` which crampes inputs on mobile — each field gets ~170px width, barely usable.

### 3. Delete uses browser `confirm()` instead of AlertDialog
Line 299: `if (!confirm(...))` — inconsistent with the platform standard of using `AlertDialog` for destructive actions.

### 4. Pagination text buttons overflow on mobile
Lines 606-630: "Previous" and "Next" text buttons plus page indicator compete for space on small screens.

---

## UI / Mobile Fixes

### 5. Replace table with card list on mobile
On `< 640px`, render each company as a compact card:
- Logo + Name + Industry badge (top row)
- Email + Outreach status (second row)
- Verified badge + action icons (bottom row)

### 6. Dialog form: stack fields on mobile
Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for all form field pairs.

### 7. Replace `confirm()` with AlertDialog
Use `AlertDialog` for delete confirmation, matching the pattern from previously audited tabs.

### 8. Pagination: icon-only on mobile
Remove "Previous"/"Next" text on small screens, keep chevron icons only.

---

## Improvements

### 9. KPI summary cards at top
Add 3 compact stats above the table: **Total Companies**, **Verified**, **Never Contacted** — derived from current query context or a quick count query.

### 10. Header buttons: compact on mobile
Stack or collapse Refresh/Batch Import/Add Company into a more mobile-friendly layout (icon-only for Refresh and Batch on mobile).

---

## Consolidated Fix Plan

| # | Category | Fix | Priority |
|---|----------|-----|----------|
| 1 | Bug/Mobile | Table → card list on mobile | High |
| 2 | Bug/Mobile | Dialog form responsive grid | High |
| 3 | Bug/UX | Replace confirm() with AlertDialog | Medium |
| 4 | Mobile | Pagination icon-only on mobile | Medium |
| 5 | Feature | KPI summary cards | Medium |
| 6 | Mobile | Header buttons compact on mobile | Medium |

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/CompaniesManager.tsx` | All fixes: mobile cards, dialog grid, AlertDialog, pagination, KPI cards, header layout |

No database changes needed.

