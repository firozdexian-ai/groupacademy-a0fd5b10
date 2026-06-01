# D4 — Instructor & Gro10x Learn Shells Copy Audit

Continues the v0.5 jargon scrub from D3, focusing on the **instructor workspace** and the **gro10x (employer/B2B) learning surfaces**. Copy/labels only — no logic, no data, no visual redesign.

## Scope

**Instructor (talent-instructor side)**
- `src/pages/app/InstructorInsights.tsx`
- `src/pages/app/InstructorReviewQueue.tsx`
- `src/pages/app/LanguageInstructorsPage.tsx`
- `src/pages/app/instructor/InstructorShell.tsx`
- `src/pages/app/instructor/InstructorCourseSessions.tsx`
- `src/pages/app/instructor/InstructorEarnings.tsx`

**Gro10x learn shells (employer side)**
- `src/gro10x/pages/Gro10xLearn.tsx`
- `src/gro10x/pages/Gro10xLearnOps.tsx`
- `src/gro10x/components/learn/OpsTracksTab.tsx`
- `src/domains/learning/components/gro10x/OpsTracksTab.tsx`

## What to look for (same v0.5 glossary as D2/D3)

1. Internal jargon — Telemetry, Ledger, Registry, Vector, Signal, Pipeline, Synthesis, Node, Phase, HUD, Schema, RPC, Tokens, Verdict.
2. Leaked feature/system names — "Authoring Feedback Loop", "Review Digest", "Item Bank", "Mastery Rollup", "Skill Signal", "Track Sweep", raw `last_source`, `needs_review`, `payout_state`.
3. Raw status pills — `pending_review`, `payout_requested`, `assignment_active`, `seat_low`, `overdue_internal`.
4. Empty states & errors → plain English.
5. CTA clarity — "Run rewrite", "Apply rewrite", "Request payout", "Assign track", "Bulk assign" should read naturally.
6. Tooltips, badges, ledger column headers (earnings, splits, fees).
7. Decorative noise — "Phase 4.x", "[cite: N]", "Cognitive Core", footer protocol strings.

## Keep (intentional domain language)
Course, Module, Cohort, Session, Track, Mastery, Skill, Credential, Earnings, Payout, Revenue split, Assignment, Seat, Review, Sponsored.

## Approach
1. `rg -in` sweep across scope for jargon glossary + leaked names.
2. Read each file end-to-end; map raw status enums shown to users.
3. Apply small, parallel `line_replace` edits — copy only.
4. Re-run sweep; expect zero hits except code identifiers / comments.

## Out of scope
- Admin learning UI (`components/admin/**`, `dashboard/learning`) — C-series.
- Edge functions, RPCs, DB.
- Talent-side learning pages (covered in D3).
- Visual redesign, layout, or interaction changes.

## Deliverable
Single batch of edits + summary table (file → before → after).

**Next after D4:** D5 — Gigs / projects talent-side hub.
