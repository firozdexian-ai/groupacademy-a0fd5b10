# Phase 9h — Cross-domain edge function migration + ESLint guard

Finish the hardening sweep started in Phases 9a–9g. After 9h, **every** `supabase.functions.invoke` call lives inside `src/domains/<owner>/api/*Api.ts`, with one documented SSE-streaming exception. Tooling enforces it from then on.

## Scope snapshot

- **~57 raw invokes** across **~50 files** in `src/pages/**`, `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/gro10x/**`.
- **~30 distinct edge functions**, most already have an owner contract; ~10 need new wrappers + contract entries.
- Two false positives to ignore: `src/edge/EdgeFunctionError.ts` and `src/edge/contracts/feed.ts` (string literals in comments/types) and `src/domains/README.md` (doc example).

## Function → owner-domain mapping

```text
agents      admin-support-assistant (9), agent-runtime, agent-blueprint,
            trigger-agent-pitch, company-agent-tools (6)
jobs        notify-hiring-event (5), parse-cv (4), send-job-application,
            generate-interview-questions (2), analyze-mock-interview (2),
            analyze-job-assessment (2), generate-application-answers,
            enhance-cover-letter
gigs        admin-gig-ops (2), ai-reviewer-brief, ai-project-scoper,
            ai-gig-verifier, ai-gig-scoper, ai-gig-public-summary,
            og-image-render
talent      unlock-talent-contact, analyze-salary, analyze-career-assessment
messaging   messaging-send, messaging-group-manager, send-transactional-email,
            telegram-diagnostic, handle-email-unsubscribe (2)
companies   signup-company
ugc         admin-content-ai
```

Ownership decisions to confirm during step 1:
- `company-agent-tools`, `admin-support-assistant` → **agents** (operate the agent runtime), not companies.
- `og-image-render` → **gigs** (only caller is `ai-gig-public-summary` flow / `ProjectPublicToggle`); if another domain ends up calling it, promote to a shared `platform` wrapper instead.
- `handle-email-unsubscribe`, `send-transactional-email` → **messaging** (transactional email surface).

## Steps

### 1. Contracts pass
For each function not yet in `src/edge/contracts/<owner>.ts`, add a `<Fn>Request` interface + Zod response schema (`.passthrough()`) read verbatim from current call-site bodies. Estimated ~12 new contract entries; the rest already exist from prior phases.

### 2. Wrapper additions (no new files expected)
Add named async wrappers to existing `src/domains/<owner>/api/<owner>Api.ts` files using the canonical pattern:

```ts
const { data, error } = await supabase.functions.invoke("<fn>", { body });
if (error) throw new EdgeFunctionError("<fn>", error);
return parseEdgeResponse("<fn>", <fn>ResponseSchema, data);
```

Re-export each new wrapper from `<domain>/api/manifest.ts` and the domain `index.ts` barrel.

### 3. Call-site migration (~50 files, ~57 invokes)
Mechanical replacement of `supabase.functions.invoke("fn", { body })` with `await fnName(body)`, wrapped in existing try/catch or adapted from `{ data, error }` destructuring. Group by owner-domain to keep PR-sized batches reviewable:

- **Batch A — agents (15 invokes):** `AdminMessagingInbox`, `useGro10xAuthChat`, agent-blueprint/runtime callers, all `admin-support-assistant` + `company-agent-tools` + `trigger-agent-pitch` sites.
- **Batch B — jobs (18 invokes):** all interview/assessment/application/cover-letter/parse-cv callers including `MockInterview*`, `JobAssessment*`, `AppJobApplication`, `ApplicationHelper`, `InlineCVUpload`, `CVUploadStep`, `OnboardingWizard`, `useInterviews`, `useOffers`, `gigAutoReview`.
- **Batch C — gigs (8 invokes):** `NewGigWizard`, `ProjectRoom`, `ReviewerCockpit`, `Gro10xProjects`, `ProjectPublicToggle`, admin-gig-ops sites.
- **Batch D — talent (3 invokes):** `SalaryAnalysisProcessing`, `AssessmentResults`, `AppCareerAssessment`, `useTalentUnlocks`, `Gro10xShortlist` (unlock-talent-contact).
- **Batch E — messaging (6 invokes):** `Unsubscribe`, `emailNotifications.ts`, `CompanyWhatsAppGroupCard`, messaging-send/group-manager sites, `telegram-diagnostic`.
- **Batch F — companies + ugc (2 invokes):** `Gro10xSignIn` (signup-company), `contentAI.ts` (admin-content-ai).

Files outside `src/domains/**` may import from `@/domains/<owner>` barrels (allowed direction).

### 4. ESLint guard
Add a `no-restricted-syntax` rule in `eslint.config.js` banning `supabase.functions.invoke` calls except in:
- `src/domains/*/api/*Api.ts` (the wrappers themselves)
- `src/components/ai-instructor/AIChatPanel.tsx` (documented SSE streaming exception — wrapper layer can't stream)

Selector sketch:

```text
files: ["**/*.{ts,tsx}"]
ignores: ["src/domains/*/api/*Api.ts",
          "src/components/ai-instructor/AIChatPanel.tsx"]
rule: no-restricted-syntax on
      CallExpression[callee.property.name="invoke"]
                    [callee.object.property.name="functions"]
```

### 5. Documentation
- Update `src/edge/README.md` ownership table with any newly-mapped functions.
- Append a Phase 9h entry to `.lovable/known-edge-contract-drift.md` listing the SSE exception and any wire-shape adaptations discovered during contract auditing.
- Mark Phase 9h ✅ in `.lovable/plan.md` and close out the Phase 9 series.

### 6. Verification
- `tsc` clean.
- `bunx eslint src` clean (new rule passes everywhere).
- `rg "supabase\.functions\.invoke" src` returns hits **only** in `src/domains/*/api/*Api.ts` and the documented `AIChatPanel.tsx`.
- Spot-check 3 migrated flows in preview: mock interview submission, gig creation, talent unlock.

## Out of scope

- Behavior changes beyond the documented `{ data, error }` → throw-on-failure adaptation.
- New edge functions or schema changes.
- Refactoring the SSE streaming wrapper (separate follow-up if desired).

## Risk

Low-to-moderate. Pattern is mechanical and identical to Phases 9a–9g, but the volume (~50 files) makes regression surface larger. Mitigation: batch by owner-domain, verify `tsc` after each batch, and rely on the new ESLint rule to catch any missed call sites before merge.

## Estimated effort

- Contracts: ~12 new entries
- Wrappers: ~25 new named exports across 7 existing files
- Call-site edits: ~57 invokes across ~50 files
- ESLint + docs: 3 files
