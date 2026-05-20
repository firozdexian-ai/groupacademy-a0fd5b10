# Phase 9d — Harden the jobs domain edge surface

Apply the Phase 9b pattern (zod contracts + `parseEdgeResponse` + `EdgeFunctionError` + named async wrappers, no `*Api` const object) to the jobs domain. Mirrors what we just shipped for talent (9b) and agents (9c).

## Scope

**In scope** — 11 in-domain files under `src/domains/jobs/` that still call `supabase.functions.invoke` directly, plus the existing skeletal `manifest.ts` and `contracts/jobs.ts`.

**Out of scope** — `src/pages/app/*` and `src/pages/*` call sites that hit jobs edge functions from other domains (talent, abroad, gigs, instructor). Those re-home in later phases; if any are touched they get logged in `known-edge-contract-drift.md`.

## Edge functions to wrap

From a sweep of `src/domains/jobs`:

| Function | Callers in domain |
|---|---|
| `score-job-match` | 3 |
| `enhance-job-description` | 2 |
| `analyze-job-market` | 1 |
| `parse-cv` | 1 |
| `parse-job-post` | 1 |
| `generate-job-share-caption` | 1 |
| `notify-application-status` | 1 |
| `notify-hiring-event` | 1 |

Existing `manifest.ts` also references `suggest-jobs-for-talent`, `cron-rebuild-job-recs`, `ai-job-share-caption` (likely an older name for `generate-job-share-caption`). The current `jobsApi` const is exported but has **zero consumers** repo-wide — safe to delete, not refactor.

## Steps

1. **Rewrite `src/edge/contracts/jobs.ts`** — replace placeholder `Record<string, unknown>` types with real zod schemas for all 8 in-use functions (plus `suggest-jobs-for-talent`, `cron-rebuild-job-recs` retained from old manifest). Mirror agents/talent style.
2. **Build `src/domains/jobs/api/jobsApi.ts`** — named async wrappers, one per function, each using `supabase.functions.invoke` → `EdgeFunctionError` → `parseEdgeResponse(schema, data)`.
3. **Reduce `manifest.ts`** to a re-export barrel (delete the `jobsApi` const + local `invoke` helper). Update `src/domains/jobs/index.ts` to re-export named functions.
4. **Migrate 10 call sites** to named imports:
   - `hooks/useEmployerPipeline.ts`, `hooks/useJobInvitations.ts`
   - `components/AIJobInsights.tsx`
   - `components/admin/JobsManagerLegacyTab.tsx`
   - `components/admin/hub/{AddExternalApplicationDialog, AIRelevanceScore, ChannelPromotionCard, JobFormDialog, JobsApplicationsTab, JobsUploadTab}.tsx`
5. **Audit** — `rg "supabase.functions.invoke" src/domains/jobs` → only `jobsApi.ts`. `rg "jobsApi\." src` → 0. `rg "from .*jobs/api/manifest" src` still resolves via the barrel.
6. **Docs** — update `src/edge/README.md` ownership table (add jobs row, list 8 functions). Append any pre-existing drift (e.g. response-shape mismatches surfaced while writing schemas) to `.lovable/known-edge-contract-drift.md`.
7. **Verify** — `tsc` clean; spot-check Jobs admin hub screens in preview.

## Decisions needed before kickoff

- **Old manifest entries with no current callers** (`suggest-jobs-for-talent`, `cron-rebuild-job-recs`, `notify-application-status` — pipeline hook may use it): **keep wrappers** so future callers have a typed surface, or **drop unused ones** and re-add when needed? Recommend **keep all 3** since they're real edge functions documented elsewhere in the system.
- **Zod schema strictness** — for response shapes we don't have full visibility into, use `z.object({...known}).passthrough()` so unknown fields don't throw, same as 9b/9c. Confirm or override.

## Size estimate

~11 files touched, ~250 LOC net. Slightly larger than 9c because there are more functions and the existing contracts file is empty placeholder.

## After 9d

Domains on the hardened pattern: talent, agents, jobs. **Phase 9e** candidates by call-site density: **abroad** (StudyAbroad*, Destination, IELTS, Language*, School pages) or **learning** (instructor/reviewer pages). Recommend abroad next — tighter cluster, ~12 files.
