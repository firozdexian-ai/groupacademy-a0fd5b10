# Phase 9d — Harden the jobs domain edge surface (COMPLETE)

Applied the Phase 9b pattern (zod contracts + `parseEdgeResponse` + `EdgeFunctionError` + named async wrappers, no `*Api` const object) to the jobs domain.

## Shipped

- **`src/edge/contracts/jobs.ts`** — rewritten with 10 typed Request interfaces + Zod response schemas (`.passthrough()`): `score-job-match`, `suggest-jobs-for-talent`, `cron-rebuild-job-recs`, `analyze-job-market`, `enhance-job-description`, `parse-cv`, `parse-job-post`, `generate-job-share-caption`, `notify-application-status`, `notify-hiring-event`.
- **`src/domains/jobs/api/jobsApi.ts`** — new file, 10 named async wrappers using `supabase.functions.invoke` → `EdgeFunctionError` → `parseEdgeResponse`.
- **`src/domains/jobs/api/manifest.ts`** — reduced to a re-export barrel; removed legacy `jobsApi` const + local `invoke` helper.
- **`src/domains/jobs/index.ts`** — barrel re-exports named functions instead of the deleted const.
- **10 call sites migrated** to named imports:
  - `hooks/useEmployerPipeline.ts` (`notifyApplicationStatus`)
  - `hooks/useJobInvitations.ts` (`notifyHiringEvent`)
  - `components/AIJobInsights.tsx` (`scoreJobMatch`, `analyzeJobMarket`)
  - `components/admin/JobsManagerLegacyTab.tsx` (`enhanceJobDescription`)
  - `components/admin/hub/{AddExternalApplicationDialog (parseCv), AIRelevanceScore (scoreJobMatch), ChannelPromotionCard (generateJobShareCaption), JobFormDialog (enhanceJobDescription), JobsApplicationsTab (scoreJobMatch), JobsUploadTab (parseJobPost)}.tsx`
- **`src/edge/README.md`** — added jobs row to the ownership table.
- **`.lovable/known-edge-contract-drift.md`** — added entry #5 noting `score-job-match` camelCase/snake_case duality.

## Verification

- `rg "supabase.functions.invoke" src/domains/jobs` → only `jobsApi.ts` (10 hits, all wrappers).
- `rg "jobsApi\." src` → 0 hits (the const is gone, only named imports remain).
- TypeScript build clean.

## Domains on the hardened pattern

talent (9b), agents (9c), jobs (9d).

## Next: Phase 9e

Recommend **abroad** domain next — tight cluster of ~12 page-level call sites (StudyAbroad*, Destination, IELTS, Language*, School), most still using raw `supabase.functions.invoke`.
