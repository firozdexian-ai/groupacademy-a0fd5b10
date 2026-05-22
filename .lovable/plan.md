# A5.4 — Job Detail Refinement

## Goal
Polish the two job-detail surfaces (`/app/jobs/:id` and public `/jobs/:id`) so they match the A5.1–A5.3 quality bar: human copy, visible match reasoning, one clear apply CTA, and a related-jobs rail. No business-logic changes.

## Current state
- **`src/pages/app/AppJobDetail.tsx` (830 lines)** — works, but riddled with jargon: `compileDeadlineMetadata`, `compileSalaryCurrencyLabel`, "HUD LEVEL 1..9" comments, "Phase Z1 Integration Stability Locked", "Evaluate Synthetic Capability Alignment", "Reconciled AI Competability Alignment Strip". Match score is shown but not explained.
- **`src/pages/PublicJobDetail.tsx` (350 lines)** — already mobile-first from Phase 3.5, but copy + share text not audited.
- **`WhyYouMatchPanel` + `VerifiedMatchBadge`** exist (used in `JobCard`) but are NOT wired into the detail page.
- **`ExternalApplicationPrep`** handles external link flow; in-app + email flows live inline. Three branches, no unified CTA component.
- **`RelatedJobs`** already imported in `AppJobDetail`; need to verify public page parity.

## Scope

### 1. Humanize `AppJobDetail.tsx`
- Rename internals: `compileDeadlineMetadata` → `getDeadlineMeta`, `compileSalaryCurrencyLabel` → `formatSalaryRange`, `jobRecordState` → `job`, `compiledSalaryLabelStr` → `salaryLabel`, etc.
- Strip "HUD LEVEL N" comments → plain section comments (`{/* Header */}`, `{/* Match score */}`, `{/* Description */}`...).
- Remove "Phase Z1" / "Launch Candidate" header block.
- User-visible string fixes:
  - "Evaluate Synthetic Capability Alignment" → "See why you match"
  - "Reconciled AI Compatability Alignment Strip" comment → removed
  - "Record Unassigned" empty state → "Job not found"
  - Any remaining "synthetic" / "alignment" / "vector" copy → plain language.

### 2. Wire `WhyYouMatchPanel` into both detail pages
- Replace the existing inline match strip in `AppJobDetail` with `<WhyYouMatchPanel job={job} talentId={talent.id} />` (component already pulls breakdown + verified-skill boost).
- Add the same panel to `PublicJobDetail` **only when** the viewer is authenticated + has a talent profile; otherwise show a "Sign in to see your match" CTA.
- Keep `VerifiedMatchBadge` next to the match% in the sticky header.

### 3. Unify apply CTA
Create a small `<JobApplyCTA job={job} existingApplication={...} />` component in `src/domains/jobs/components/` that branches once on `application_type` (`in_app` | `link` | `email`) and renders:
  - **in_app** → primary button → `/app/jobs/:id/apply`
  - **link** → primary button → opens `ExternalApplicationPrep` sheet
  - **email** → primary `mailto:` button + small "Copy email" secondary
  - **already applied** → disabled "Applied · {status}" badge + "View application" link
  - **deadline passed** → disabled "Closed"
Use it in both the inline section and the mobile sticky footer of `AppJobDetail`, and in `PublicJobDetail` (auth-gated: unauthenticated users get "Sign in to apply" routing through `safeReturnTo`).

### 4. Public page polish
- Audit `PublicJobDetail` copy + share text (use AI Job Sharing Captions memo).
- Ensure JSON-LD `JobPosting` schema is present (per SEO memo).
- Add `RelatedJobs` rail at the bottom (public-safe variant — no talent-personalized ranking, just same-company + same-location fallback).

### 5. Jargon scrub — secondary files
- `src/pages/app/AppJobApplication.tsx` — quick pass for similar "HUD"/"synthetic" patterns.
- `src/domains/jobs/components/ExternalApplicationPrep.tsx` — verify copy.

### 6. Audit log
Append **A5.4 shipped** block to `.lovable/launch-audit.md` listing the 5 changes above.

## Out of scope
- No DB or RPC changes.
- No new edge functions.
- No changes to `score-job-match` logic (already produces `verified_match` payload that `WhyYouMatchPanel` consumes).
- No referral/share-system rework (already shipped).

## Files touched
- **Edited:** `src/pages/app/AppJobDetail.tsx`, `src/pages/PublicJobDetail.tsx`, `src/pages/app/AppJobApplication.tsx`, `src/domains/jobs/components/ExternalApplicationPrep.tsx`, `src/domains/jobs/index.ts`, `.lovable/launch-audit.md`, `.lovable/plan.md`
- **Created:** `src/domains/jobs/components/JobApplyCTA.tsx`

## Estimated time
60–90 min. No migrations, no edge deploys.
