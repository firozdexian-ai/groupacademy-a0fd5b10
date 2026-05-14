# GTM (Group #8 — Geography) Deep Audit

Scope: 6 sidebar tabs (Dashboard, Countries, States/Regions, Cities, Clusters, Knowledge Packs) — 4 files, ~1,151 LOC, 5 tables (`gtm_countries`, `gtm_regions`, `gtm_cities`, `gtm_clusters`, `country_knowledge_packs`).

DB state: 7 countries, **0 regions, 0 cities, 0 clusters, 0 knowledge packs**, 2,670 talents with `country` set.

## Findings

### 🔴 Critical bugs

- **G1 — Cluster composition UI is a stub.** `GtmTabs.tsx:610` reads *"Node selection UI pending Phase 6.2 update."* The `countries[]` and `cities[]` arrays of `gtm_clusters` cannot be edited from the dashboard at all. The Clusters tab can create a name + description shell but the cluster is functionally empty. This is the same family of bug as HR's stripped Assign-Talent dialog.
- **G2 — `useGtmGraph` mutation factory anti-pattern.** Same Rules-of-Hooks violation we just fixed in `useHrGraph`. `createUpsertMutation` / `createDeleteMutation` call `useMutation` inside non-hook helpers, then are invoked 10× in the return block (lines 91–100). Works today but: (a) hook order is fragile, (b) React 18 strict-mode/Suspense will surface warnings, (c) any conditional call breaks. Inline the 10 mutations directly.
- **G3 — Talent-density string bridge is silently lossy.** `gtmGraphQuery` aggregates `talents.country` (free text) against `gtm_countries.name`. Memory says `normalize_country_name` trigger exists, but: legacy rows, casing drift, "Bangladesh " vs "Bangladesh", or talents whose country is NOT in `gtm_countries` all silently disappear from the Overview. Should aggregate by iso2 via a server-side RPC and surface an "Unmapped" bucket.
- **G4 — N+1-style client aggregation in Overview.** `GtmOverviewTab` reads all talents (`talents.select("country")` — currently 2,670 rows, will scale to 50k+) just to count by country. Plus the `Active Deployment Zones` block re-filters `data.regions` per country in render. Move both rollups into one `get_gtm_dashboard()` RPC returning `{country_id, iso2, name, tier, is_active, region_count, city_count, talent_count}` plus an `unmapped_talent_count` and a `top_talent_countries` array.

### 🟠 Warnings

- **G5 — `confirm()` browser dialog × 5** (countries, regions, cities, clusters, knowledge packs). Breaks the brutalist theme. Replace with `AlertDialog` like HR-Z1.
- **G6 — No search / no tier filter on registries.** Tables are flat. Fine at 7 countries; unusable when we seed the full ISO list or thousands of cities. Need a top-bar search + a Tier filter on Countries, a Country filter on Regions, a Region+Country filter on Cities.
- **G7 — No bulk-seed path.** With only manual `Deploy Node` dialogs and 0 regions/cities in DB, the team cannot realistically populate the global geography. Need a CSV import (or one-shot ISO seed migration) for `gtm_countries` (full ISO list), and a "Seed regions/cities for country" action that pulls from a static dataset or admin-pasted CSV.
- **G8 — `country_knowledge_packs.country_code` is text, not an FK to `gtm_countries.iso2`.** Lookup in UI works, but nothing prevents orphan packs. Add FK or normalize via trigger.
- **G9 — Knowledge pack body has no markdown preview.** Admin types markdown blind. Add a tabbed preview using existing `react-markdown` (already in app).
- **G10 — `gtm_countries.tier` is unconstrained text** populated by a 3-value Select. Add a check constraint (`'Tier 1' | 'Tier 2' | 'Tier 3'`) so direct DB writes can't drift.
- **G11 — Region/city tabs show no talent or operational rollup.** Counts only exist at country level. Add a "talent count" / "city count" column at region level once the RPC exists.
- **G12 — `GtmKnowledgeTab` wraps in `p-6`** while the other tabs don't — double padding inside the dashboard shell. Drop the wrapper padding for visual parity.
- **G13 — `gtm_clusters.owner_user_id` is captured but never set or shown.** Either wire it (auto-set to `auth.uid()` on insert + show owner badge) or drop it from the type.

### ✅ What works

Country/Region/City CRUD plumbing is correct; brutalist styling matches the rest of the dashboard; Overview KPI tiles render cleanly; Knowledge Pack dialog form is complete (title, country, kind, status, markdown body, source URL, sort order).

## Did we strip anything in prior passes?

Checked: `GtmTabs.tsx` is intact end-to-end (no `{/* ... */}` placeholder fragments, all 4 tab components export their full Dialog). `GtmKnowledgeTab.tsx` likewise complete. The single intentional gap is **G1 (cluster composition)** — that one is explicitly marked "pending Phase 6.2", not stripped. No regressions to restore.

## Phase GTM-Z1 plan (must-fix this pass)

| ID | Fix | Files |
|---|---|---|
| G1 | Build cluster composition UI: multi-select countries chip-picker + multi-select cities chip-picker (filtered by selected countries), with selected pills showing remove × | `GtmTabs.tsx` (~+120) |
| G2 | Inline 10 mutations directly in `useGtmGraph`, drop the factory helpers | `hooks/useGtmGraph.ts` (rewrite, same LOC) |
| G3 + G4 | New `get_gtm_dashboard()` RPC (SECURITY DEFINER, search_path public) returning enriched country rows + `unmapped_talent_count`. Overview switches to RPC; Talent Density block keys off iso2; "Unmapped" appears as a final amber row when > 0 | DB migration; `GtmOverviewTab.tsx` (~−40/+30) |
| G5 | Swap all 5 `confirm()` calls for the existing `AlertDialog` pattern from HR-Z1 | `GtmTabs.tsx`, `GtmKnowledgeTab.tsx` |
| G10 | Add check constraint on `gtm_countries.tier` | DB migration |
| G12 | Drop `p-6` wrapper in `GtmKnowledgeTab` | `GtmKnowledgeTab.tsx` |

## Stretch (same pass if time allows)

- **G6** — search + Tier filter on Countries, Country filter on Regions, Region filter on Cities (~+40 each)
- **G9** — markdown preview tab in Knowledge Pack dialog using `react-markdown` (~+30)
- **G11** — once RPC lands, surface `talent_count` column on Regions tab and `talent_count` on Cities tab (rolled up from talents → city via region join, or left null if no city link exists yet)

## Defer

- **G7 (bulk seed / CSV import)** — meaningful work; better as its own phase once we know the canonical dataset (Countries-States-Cities JSON vs admin upload).
- **G8 (FK on `country_knowledge_packs.country_code`)** — needs a one-time data cleanup of any orphan rows first; safer in a follow-up.
- **G13 (owner_user_id)** — product call: do we want clusters scoped per-owner? Park until product confirms.

## Memory updates

After ship: append "GTM-Z1 closed" line to `mem://admin/groups-7-to-10-stakeholder-structure`. No new memory files needed.

## Out of scope

`AdminSidebar` group title rename, any changes to `talents.country` source-of-truth, real `MapView` visualization (separate phase).
