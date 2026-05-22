# A5.5 — Jobs Hub Closeout

Final polish pass on the Jobs Hub. All carry-overs from A5.1–A5.4 batched into one focused sweep. Pure UI/copy + one routing decision. **No DB, RPC, edge-function, or business-logic changes.**

## Scope

### 1. `/app/jobs/all` — collapse the duplicate browse surface
- `AppJobs.tsx` (426 lines) duplicates what `BrowseView` + `InfiniteJobsList` already deliver inside `/app/jobs` (Browse tab).
- **Decision:** redirect `/app/jobs/all` → `/app/jobs?tab=browse`, preserving query params (`?q=`, `?company=`, `?city=`). Pass them through as initial filter state for `BrowseView`.
- Update `BrowseView` to read `q`, `company`, `city` from `useSearchParams` and seed `InfiniteJobsList` filters / `JobPreferencesSheet` accordingly.
- Update `JobsHubHeader` "View all" link + Browse "View all" link to point at `/app/jobs?tab=browse` instead of `/app/jobs/all`.
- Delete `AppJobs.tsx` after the redirect is in place. Remove its route from `App.tsx`; add a `<Navigate>` shim so any old bookmark/email link still resolves.

### 2. `JobAssessment.tsx` + `JobAssessmentResults.tsx` — copy + comment scrub
- Strip "Phase Z1 Transaction Matrix Sealed", "Launch Candidate", "HUD LEVEL N" headers.
- Replace any user-visible jargon (search for: `Synthetic`, `Telemetry`, `Quantum`, `Vetting`, `Registry`, `Trajectory`, `Capability Alignment`, `Manifest`, `Ledger Settlement`) with plain English equivalents matching the A5.4 tone:
  - "Initialize Vetting Sequence" → "Start assessment"
  - "Capability Alignment Score" → "Your match"
  - "Synthetic Reasoning" → "AI feedback"
  - Toasts / error strings → friendly copy
- Internal variable renames only where they obscure intent (`jobsRegistryPayload` → `jobs`, `filterRegistry` → `excludeIds`).

### 3. `CompanyDetailSheet.tsx` — copy pass
- Remove `Phase Z0 Hardened` header + `HUD: FIXED HEADER ROW SECTION` comments.
- Audit visible strings; replace any "Ecosystem / Workforce / Registry" phrasing with plain "Company / Team / Jobs".
- Verify follow-button copy matches `CompanyCard` ("Follow X" / "Following").

### 4. `RelatedJobs.tsx` — comment-only scrub
- Remove `Phase Z0 Hardened` + `HUD: SECTION COMPLIANCE HEADER STRIP` comments.
- Rename `filterRegistry` → `excludeIds`, `exclusionArray` → `exclude`.
- No visible copy changes (already clean per A5.4 audit).

### 5. Comment-only sweep (deferred carry-over)
- `useJobsHubDashboard`, `useRankedJobs`, `JobCard`, `InfiniteJobsList` — delete `Phase Z0 Hardened`, `Digital Workforce`, `CTO Reference`, `HUD: EXECUTING_…` JSDoc/inline comments. No runtime changes.

### 6. Audit log
- Append `## A5.5 — Jobs Hub Closeout — shipped` block to `.lovable/launch-audit.md` summarizing the above.
- Update `.lovable/plan.md` with closeout outcome + next-phase pointer.

## Out of scope
- No changes to `score-job-match`, `get_jobs_hub_dashboard`, `get_ranked_jobs_for_talent`, or any RPC.
- No changes to `tool_runs`, `JobApplyCTA`, `WhyYouMatchPanel` logic.
- No filter UX redesign on the merged Browse tab — only seed filters from URL params; existing `JobPreferencesSheet` UI is reused as-is.
- No new components (other than possibly a `<Navigate>` route shim).
- Companies / Locations tab data flows untouched.

## Technical details

**Routing change (`App.tsx`):**
```tsx
// before
<Route path="/app/jobs/all" element={<AppJobs />} />
// after
<Route path="/app/jobs/all" element={<Navigate to={`/app/jobs?tab=browse${preservedSearch}`} replace />} />
```
Either a tiny inline component that reads `useLocation().search` and forwards it, or delete the route and rely on `BrowseView` URL params.

**`BrowseView` URL-param seeding:**
```tsx
const [params] = useSearchParams();
const initialFilters = {
  q: params.get("q") ?? "",
  company: params.get("company") ?? null,
  city: params.get("city") ?? null,
};
// pass into InfiniteJobsList + sync into JobPreferencesSheet state
```

**Files**
- Edited: `src/App.tsx`, `src/domains/jobs/components/views/BrowseView.tsx`, `src/domains/jobs/components/JobsHubHeader.tsx`, `src/pages/app/JobAssessment.tsx`, `src/pages/app/JobAssessmentResults.tsx`, `src/domains/jobs/components/CompanyDetailSheet.tsx`, `src/domains/jobs/components/RelatedJobs.tsx`, `src/domains/jobs/hooks/useJobsHubDashboard.ts`, `src/domains/jobs/hooks/useRankedJobs.ts`, `src/domains/jobs/components/JobCard.tsx`, `src/domains/jobs/components/InfiniteJobsList.tsx`, `.lovable/launch-audit.md`, `.lovable/plan.md`
- Deleted: `src/pages/app/AppJobs.tsx`

## Estimate
~45–60 min. No migrations, no edge deploys, no schema changes. Low risk — the only behavioral change is the `/app/jobs/all` redirect, which I'll guard with query-param preservation so existing bookmarks still land on the right filtered list.

## After A5.5
Jobs Hub is fully shipped and audited. Next options:
- **A6** — Gigs Hub parity (apply the A5 pattern to `/app/gigs`)
- **A7** — Profile / Talent Mirror polish (`/t/:handle` + verified credentials)
- **A8** — Employer/Gro10x side audit (CRM, pipeline, offer composer)
