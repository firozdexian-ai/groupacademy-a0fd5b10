## Phase 8 — Retire legacy `src/components/dashboard/` barrels

After Phase 7, the admin shell loads everything from canonical `@/domains/*` and `@/platform/admin/*` paths. The 213-file `src/components/dashboard/` tree is now a pure forwarding layer — every file is a one-line `export … from "@/domains/<x>"` or `@/platform/admin/<x>` re-export. Phase 8 deletes that layer and rewrites the remaining external importers so the legacy paths stop existing entirely.

### Scope

1. **Rewrite 35 external importers** that still reference `@/components/dashboard/...`. For each import:
   - Read the matching barrel file in `src/components/dashboard/<domain>/<File>.tsx` to learn its canonical target (`@/domains/<domain>/components/admin/<File>` or `@/platform/admin/...`).
   - Update the importer in place, preserving the same named / default specifiers.
   - Files affected (already enumerated): 4 page files (`ModuleResourcesManager`, `ModuleManagement`, `DashboardChat`, `ContentEdit`), 1 lib (`contentReadiness.ts`), 2 indexes (`platform/admin/index.ts`, `domains/talent/index.ts`), and 28 in-domain files across ugc, companies, talent, jobs, marketing, learning, ir, finance, workforce, analytics, agents.

2. **Delete the legacy tree** `src/components/dashboard/` in full (all 213 files across 19 subfolders + 4 root chrome files). All consumers will be on canonical paths by then.

3. **Sanity sweep**: re-grep `@/components/dashboard/` across `src/` — must return 0.

### Out of scope

- Phase 9 (typed `*Api` edge wrappers).
- Any behavior, prop, or UI change.
- Splitting `AdminSidebar.tsx` or other oversized files.
- Touching `supabase.functions.invoke` call sites.

### Technical notes

- Mechanical, file-by-file rewrites using `code--line_replace` (or `sed -i` where a barrel maps cleanly, e.g. `@/components/dashboard/talent/X` → `@/domains/talent/components/admin/X`). Most domains follow that exact pattern; the four chrome files (`AdminSidebar`, `DashboardSkeleton`, `ImpersonationBanner`, `StatsCard`) and `common/*` map to `@/platform/admin/chrome|ui/...`.
- A few barrels re-export from non-obvious locations (e.g. `messaging/`, `chat/`, `performance/`, `agents/`). Each will be read before rewriting its consumers — no blind sed across those.
- After deletion, run `tsc` (via auto build) to confirm zero unresolved imports.

### Verification

- `rg "@/components/dashboard/" src` → 0 matches.
- `test ! -d src/components/dashboard` → true.
- `tsc` clean; Dashboard `?tab=` routes still mount (already covered by Phase 7 registry, which imports only canonical paths).

### Progress after Phase 8

~99%. Only Phase 9 remains (typed edge function wrappers).