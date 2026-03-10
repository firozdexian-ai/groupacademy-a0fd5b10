

# Jobs KPI Dashboard — Full Audit Report

## Current State
583 lines. A well-structured analytics dashboard with a hero progress section, 7 stat cards, 2 charts (daily bar + source pie), and a recent jobs table. Overall solid — fewer issues than other tabs.

---

## Bugs

### 1. "View All" button is non-functional
Line 548: The "View All" button on the Recent Jobs table does nothing — no `onClick` handler. Should navigate to the Jobs Manager tab.

### 2. No error handling on target save failure
Lines 214-241: `handleSaveTarget` catches errors and toasts, but doesn't check the Supabase response for `error` — it only catches thrown exceptions. If the upsert silently fails (RLS deny), the admin sees "Target updated!" falsely.

### 3. Circular progress SVG not responsive on small screens
The circular progress uses fixed `w-40 h-40` with hardcoded `cx="80" cy="80" r="70"` — works fine on desktop but takes too much space on mobile relative to the stats beside it.

---

## UI / Mobile Fixes

### 4. Hero section layout breaks on mobile
The `flex-col lg:flex-row` layout stacks the circle above stats, but the 3-column grid inside (`grid-cols-3`) gets cramped on small phones. Should be `grid-cols-1 sm:grid-cols-3`.

### 5. Quick stats grid: 7 columns on desktop, 2 on mobile — uneven
`grid-cols-2 md:grid-cols-3 lg:grid-cols-7` means on mobile the 7th card sits alone. Consider `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` with a 2-row layout, or keep 7 but use `grid-cols-3` on mobile so the orphan card is less jarring.

### 6. Recent jobs list not mobile-optimized
The row layout with vacancies + applications + date badge side-by-side gets cut off on small screens. Should stack or hide secondary metrics on mobile.

### 7. Pie chart labels overlap on small screens
`labelLine={false}` helps, but the inline percentage labels still collide when there are 4+ sources. On mobile, switch to a legend-only view or a horizontal bar instead.

---

## Improvements

### 8. Missing conversion funnel metric
The dashboard shows Apply Clicks and Applications separately but doesn't show the **conversion rate** (Applications / Apply Clicks). This is the most actionable metric for understanding job listing quality. Add as a derived stat card.

### 9. No seeker-side connection for "Expiring Soon"
The KPI shows jobs expiring this week, but there's no quick action to extend deadlines or batch-deactivate. Add a clickable badge that filters to expiring jobs in Jobs Manager.

### 10. No month-over-month comparison
All metrics are current-month only. Adding a simple "+X% vs last month" trend indicator on the key cards (Jobs Posted, Applications, Unique Applicants) would give context.

### 11. Missing share/distribution analytics
The Jobs Manager tracks `job_share_logs` (channel distribution), but the KPI dashboard doesn't surface total shares or shares-by-channel. Add a "Total Shares" stat card and optionally a channel breakdown.

### 12. No refresh button
The dashboard loads once on mount. Admin can't refresh without navigating away. Add a refresh icon button near the title.

---

## Refactoring

### 13. Data fetching is one giant function
`loadData()` is ~130 lines making 8 sequential Supabase calls. Should parallelize independent queries using `Promise.all` for faster load times.

### 14. Inline SVG circular progress should be a component
The circular progress SVG (lines 274-302) is a reusable pattern. Extract to a `CircularProgress` component.

---

## Consolidated Fix Plan

| # | Category | Fix | Priority |
|---|----------|-----|----------|
| 1 | Bug | Wire "View All" to switch to Jobs Manager tab | High |
| 2 | Bug | Check Supabase `.error` on target save | High |
| 3 | Mobile | Shrink circular progress on mobile (`w-28 h-28 sm:w-40 sm:h-40`) | Medium |
| 4 | Mobile | Hero stats grid: `grid-cols-1 sm:grid-cols-3` | Medium |
| 5 | Mobile | Quick stats: `grid-cols-2 sm:grid-cols-4` (2 rows of 4, but keep all 7) | Medium |
| 6 | Mobile | Recent jobs: stack layout on mobile with `flex-col sm:flex-row` | Medium |
| 7 | Mobile | Pie chart: hide inline labels on small screens, rely on legend | Low |
| 8 | Feature | Add Conversion Rate card (Applications / Apply Clicks %) | High |
| 9 | Feature | Make "Expiring Soon" clickable → navigate to Jobs Manager filtered | Medium |
| 10 | Feature | Month-over-month trend badges on 3 key cards | Medium |
| 11 | Feature | Add Total Shares stat card from `job_share_logs` | Medium |
| 12 | Feature | Add refresh button | Low |
| 13 | Refactor | Parallelize queries with `Promise.all` | High |
| 14 | Refactor | Extract `CircularProgress` component | Low |

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/JobsKPIDashboard.tsx` | All fixes above |
| `src/pages/Dashboard.tsx` | Possibly wire "View All" tab switch callback |

No database changes needed — all data sources already exist.

