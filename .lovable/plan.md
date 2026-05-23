# Phase A9 — Admin Shell Jargon Sweep

Humanize the `/dashboard/*` admin surfaces. After A5–A8 cleaned the talent app, the admin shell still reads in Phase-Z jargon ("Recruitment OS", "Infrastructure_Manage", "Nexus Console", "Intelligence_Pipeline", etc.). This phase brings admin labels in line with the rest of the product — plain English, sentence case, no underscores in UI strings.

## Scope

**In scope (copy-only, user-visible strings):**
- `src/pages/Dashboard.tsx` — fallback titles, "Nexus Console" + similar chrome strings.
- `src/shells/admin/routes/*.ts` — `TITLES` maps across all 16 route groups (overview, talent, companies, jobs, marketing, learning, finance, gigs, abroad, agents, ir, institutions, hr, ugc, gtm, misc).
- `src/platform/admin/chrome/AdminSidebar.tsx` + sidebar group/section labels.
- `src/domains/*/components/admin/**` hub headers, tab labels, empty/error states, toasts. Priority targets surfaced by audit:
  - `src/domains/jobs/components/admin/hub/JobsHub.tsx` ("Recruitment OS", `Infrastructure_Manage`, etc.)
  - Equivalent hubs in companies, talent, gigs, abroad, learning, finance, ir, institutions, ugc, gtm, marketing, agents, hr.
- `src/pages/DashboardChat.tsx` chrome only if jargon is present.

**Out of scope:**
- Business logic, RPCs, edge functions, RLS, repo/api layers.
- Schema / column names / event keys / route slugs (`?tab=quiz-manage` stays).
- JSDoc and code comments (tracked separately as the low-priority JSDoc sweep).
- Gro10x and talent shells (already done in A5–A8).
- Visual redesign — keep existing layout, spacing, icons, gradients.

## Approach

1. **Audit (parallel `rg`)** — sweep admin paths for jargon markers: `Nexus`, `OS\b`, `Ingress`, `Synchroniz`, `Ledger`, `Ecosystem`, `Handshake`, `Pipeline`, `Trajectory`, `Matrix`, `Protocol`, `Vector`, `Phase Z`, `Infrastructure_`, `Intelligence_`, `Growth_`, `Data_`, underscores inside `>...<` JSX text, ALL-CAPS labels. Produce a hit list grouped by file.
2. **Rewrite in batches by domain group** (one batch per admin group from the index memory):
   - Group 1 Talent → Group 2 Companies → Group 3 Agents → Group 4 IR → Group 5 Institutions → Groups 7–10 (Workforce/GTM/UGC/Jobs) → Groups 11–16 (Learn/Gig/Abroad/Marketing/Finance/Platform).
   - For each batch: read all affected files in parallel, apply targeted `line_replace` edits, keep underlying logic untouched.
3. **Route `TITLES`** — single pass across all `src/shells/admin/routes/*.ts` to normalize tab titles (e.g. "Certification Logic" → "Quiz management").
4. **Dashboard chrome** — `Dashboard.tsx`, `AdminSidebar.tsx` fallback strings + section headers.
5. **Verify** — re-run the jargon `rg` scoped to `src/pages/Dashboard*`, `src/shells/admin`, `src/platform/admin`, `src/domains/*/components/admin` and confirm zero remaining hits in JSX text / string literals exposed to the UI.
6. **Docs** — mark A9 done in `.lovable/plan.md` and `.lovable/launch-audit.md`; carry the JSDoc/identifier sweep forward as the only remaining cleanup.

## Style rules (consistent with A5–A8)

- Sentence case for tab/section titles ("Talent pipeline", not "TALENT_PIPELINE" or "Talent Pipeline OS").
- No underscores in user-visible strings.
- Verb-led, plain English for CTAs ("Move stage", "Export CSV").
- Keep brand terms: Gro10x, GroUp Academy, Lovable Cloud.
- Preserve existing icons, badges, layout, and semantic tokens.

## Estimated footprint

~25–40 files, copy-only. No migrations, no edge changes, no schema impact.

## Open question

Want me to also rename admin route `TITLES` that are referenced by analytics or saved bookmarks (e.g. "Certification Logic" → "Quiz management"), or keep titles 1:1 with the existing keys to avoid disrupting saved tabs? Default: rename — `?tab=` keys stay stable, only the human-readable title changes, so bookmarks are unaffected.
