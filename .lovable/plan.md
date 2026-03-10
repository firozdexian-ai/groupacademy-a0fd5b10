

# Jobs Manager (Manage Jobs) — Full Audit Report

## Current State
1543 lines. Three main sections: ShareJobDialog (social sharing with AI captions), JobForm (create/edit with AI parse + enhance), and the main JobsManager list with filters, table, and pagination. Feature-rich but has significant mobile/UI issues and some bugs.

---

## Bugs

### 1. Share Dialog unusable on mobile
Line 314: `flex gap-6` with `w-1/3` sidebar + `flex-1` content. At 391px this creates a ~120px sidebar — too narrow for button labels. The entire dialog layout breaks on mobile.

### 2. Job Form grids overflow on mobile
Lines 584, 597, 621, 656, 823, 856, 902: Multiple `grid-cols-2` and `grid-cols-3` layouts without responsive breakpoints. At 391px, form fields get squeezed to ~160px width — inputs become unusable.

### 3. Header buttons overflow horizontally
Lines 1239-1265: Three buttons ("Deactivate Expired", "Import LinkedIn", "Add Job") sit in a `flex gap-2` row. At 391px these overflow the card width, causing horizontal scroll — violating our no-horizontal-scroll principle.

### 4. Filter bar overflows on mobile
Lines 1267-1390: Four filter controls (search input, status select, location popover, company select) all in one `flex-wrap` row with `min-w-[200px]` on the search input. At 391px, the 200px minimum plus fixed-width selects force horizontal overflow.

### 5. Table with 8 columns causes horizontal scroll
Lines 1399-1496: The table has 8 columns (Job, Location, Type, Status, Shared, Clicks, Deadline, Actions). At 391px this forces side-scrolling inside the table — the exact pattern we want to avoid.

### 6. No error handling on delete
Line 1200: `handleDelete` doesn't check the Supabase response for errors. A failed delete (RLS deny) silently passes while "Deleted" toast shows.

### 7. Share/click counts fetched sequentially after jobs
Lines 1099-1129: Share logs and apply clicks are fetched sequentially after the main jobs query. Should be parallelized.

---

## UI / Mobile Fixes

### 8. Header: stack buttons vertically on mobile
Change the header to `flex-col sm:flex-row` with full-width buttons on mobile. Shorten button labels on mobile ("Expire" instead of "Deactivate Expired", icon-only for LinkedIn import).

### 9. Filter bar: 2-column grid on mobile
Convert filters to `grid grid-cols-2 sm:flex` layout. Search takes full width (`col-span-2`), status + location + company each take one cell.

### 10. Replace table with card list on mobile
On mobile (< 640px), render each job as a compact card instead of a table row. Show title, company, status badge, deadline, and action icons. Hide Location/Type/Shared/Clicks columns and show key info inline.

### 11. Share Dialog: full-screen on mobile
On mobile, switch ShareJobDialog to a vertical layout — channel tabs as horizontal scrollable pills at top, content below. Remove the `w-1/3` sidebar split.

### 12. Job Form: single-column on mobile
Change all `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` and `grid-cols-3` to `grid-cols-1 sm:grid-cols-3`. Dialog should be full-screen on mobile (`max-w-full sm:max-w-3xl`).

---

## Improvements

### 13. No bulk selection/actions
Admin can only delete one job at a time. Add checkbox selection with bulk actions (deactivate, delete, feature/unfeature).

### 14. Missing "Source Platform" indicator in list
Jobs have `source_platform` (linkedin, facebook, etc.) but it's not shown in the table/cards. Add a small icon next to the job title.

---

## Refactoring

### 15. Parallelize share + click count fetches
Lines 1099-1129: Use `Promise.all` for share logs and apply clicks queries after the main jobs fetch.

### 16. ShareJobDialog is 200+ lines inline
Extract to its own file for maintainability.

---

## Consolidated Fix Plan

| # | Category | Fix | Priority |
|---|----------|-----|----------|
| 1 | Bug | Share Dialog — vertical layout on mobile | High |
| 2 | Bug | Job Form — single-column grids on mobile | High |
| 3 | Bug | Header buttons — stack on mobile, shorten labels | High |
| 4 | Bug | Filter bar — 2-col grid on mobile | High |
| 5 | Bug | Table → card list on mobile | High |
| 6 | Bug | Add error check on delete | Medium |
| 7 | Refactor | Parallelize share+click fetches | Medium |
| 8 | Mobile | Dialog full-screen on mobile | Medium |
| 9 | Feature | Source platform icon in job list | Low |
| 10 | Feature | Bulk selection/actions | Low (defer) |

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/JobsManager.tsx` | All fixes above (mobile layouts, bug fixes, refactoring) |

No database changes needed. Single file, ~10 targeted changes. Bulk selection (#10) deferred to a future pass to keep scope manageable.

