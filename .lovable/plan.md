# Phase 3.4 — Job Details + Application Workflow

The Tools tab is consolidated. Now the actual transaction — viewing a role and applying — needs the same overhaul. Today's `AppJobDetail` is dense, "executive logic" framing, three-column desktop layout that collapses awkwardly on the 390px mobile viewport users actually live on. `MyApplications` is a flat list. The apply flow is a separate 488-line page with its own CV/cover-letter logic.

3.4 turns the detail page into a single-screen decision surface and the application step into a confident 2-tap submit, with applications becoming a real **tracked pipeline** the user can revisit.

---

## Scope

### A. Job Details redesign (`/app/jobs/:id`)

Replace the current page top-to-bottom with a mobile-first stack:

```text
┌──────────────────────────────────────────┐
│ Sticky header: ← Back   ♥ Save  Share    │
├──────────────────────────────────────────┤
│ Logo  Title                              │
│       Company · Location · Remote chip   │
│       Salary range · Job type · Level    │
├──────────────────────────────────────────┤
│ MATCH STRIP (auto-runs if free, else CTA)│
│  87% match  ✓ skills · ✓ exp · ⚠ tools   │
│  [Why you match ↓]  [Score me · 10 cr]   │
├──────────────────────────────────────────┤
│ About this role  (collapsible, 4 lines)  │
├──────────────────────────────────────────┤
│ Requirements & nice-to-haves  (chips)    │
├──────────────────────────────────────────┤
│ About the company  (logo + 1-line bio)   │
├──────────────────────────────────────────┤
│ Similar roles rail                       │
├──────────────────────────────────────────┤
│ Sticky bottom bar:                       │
│  ⏰ Closes in 3 days     [Apply now →]   │
└──────────────────────────────────────────┘
```

Key behaviors:
- **Match strip** — if user has a verified profile + CV, auto-fetches cached `match_score` (no credits, just read). If no cached score and user has saved/viewed signal, shows "Score me · 10 cr" inline; uses existing `score-job-match` edge + `recordToolRun({toolKey:"score"})`.
- **Sticky apply bar** — always visible on mobile, swaps to "Closed", "Submitted ✓", or "Continue assessment →" based on state.
- **One CTA** per state — kill the dual "Save big button + Initialize Application" duplication.
- **Deadline urgency** — color shifts (neutral → amber ≤7d → red ≤2d).
- Strip the italic "Operational Parameters / List Narrative" copy. Plain English: About this role, Requirements, About the company.
- Verified company badge (uses existing `company_verification_tier`).

### B. Application workflow (`/app/jobs/:id/apply`)

Today: 488-line page. Target: ~200 lines, 2-step sheet on mobile:

**Step 1 — Confirm package** (auto-prefilled from profile)
- CV: latest profile CV with "Use this" / "Upload different" toggle
- Cover letter: empty by default, with a **"Polish with AI"** chip → reuses `generate-application-answers` edge to draft a 4-paragraph letter from job + profile (10 cr, recorded as `tool_runs.toolKey='answers'`)
- Application questions (if `application_type='internal'` and job has `assessment_config.questions`): show inline

**Step 2 — Confirm & submit**
- Cost summary: "Application: 5 cr · Total: 5 cr"
- Submit button → inserts `job_applications` row, fires `notify-employer-application` (existing or new), navigates to `/app/applications/:id` confirmation
- If `ai_assessment_enabled` → branch to `/app/job-assessment/:assessmentId` instead of confirmation

### C. Applications tracker (`/app/applications`)

Today: status timeline exists but the page mixes everything. Reframe as 3 tabs:

- **Active** — submitted / sent / viewed / shortlisted (default tab)
- **Action needed** — pending assessment, employer message reply, missing CV
- **Closed** — rejected / withdrawn / hired

Each row:
- Logo + title + company + applied X ago
- Status pill (Submitted · Viewed · Shortlisted · Rejected · Hired)
- Right chevron → `/app/applications/:id` detail
- For `Action needed`: amber chip with the action ("Start AI assessment", "Reply to recruiter")

### D. Application detail (`/app/applications/:id`) — new page

Single screen showing:
- Job snapshot (clickable → back to `/app/jobs/:id`)
- Timeline (existing `ApplicationTimeline` component, extracted)
- Submitted CV + cover letter (read-only, "View CV" opens signed URL)
- AI match score & rationale (cached from `job_applications.ai_match_score` / `ai_match_rationale`)
- AI assessment status if applicable, with deep link
- "Withdraw application" destructive action

### E. AI assessment on job (no new functionality, integration polish)

- The existing `/app/job-assessment/:id` flow already works. 3.4 just makes the hand-off seamless from B (apply) and C (action needed tab).
- Add `tool_runs` write on assessment completion (`toolKey='assessment'`, `jobId`).

---

## Backend

### Status enum extension
Current `application_status` enum: `submitted | sent_to_employer | viewed | shortlisted | rejected`.

Add: `withdrawn`, `hired`. (Migration alters enum.)

### New columns on `job_applications`
- `withdrawn_at timestamptz`
- `last_status_at timestamptz` (auto-updated by trigger when `application_status` changes — drives sort order in the tracker)

### New RPC: `get_application_buckets(p_user_id uuid) returns jsonb`
Returns counts per bucket (active / action_needed / closed) so the tabs can show pill counts without a second query.

### No new edge functions
- Cover letter polish uses existing `generate-application-answers` (just a new prompt template variant — handled client-side by passing `mode:"cover_letter"` in body; if that mode doesn't exist yet, add it as a 10-line branch in the existing edge).

---

## Frontend file plan

### New
- `src/components/jobs/JobMatchStrip.tsx` — match score + Why panel
- `src/components/jobs/JobApplyBar.tsx` — sticky bottom CTA
- `src/components/jobs/JobMetaPills.tsx` — salary/type/level/remote chips
- `src/components/jobs/CompanyMiniCard.tsx`
- `src/components/applications/ApplicationsTabs.tsx` — Active/Action/Closed
- `src/components/applications/ApplicationActionChip.tsx`
- `src/pages/app/AppApplicationDetail.tsx`
- `src/hooks/useJobMatchCached.ts` (read-only fetch from `job_applications.ai_match_score`)
- `src/hooks/useApplicationBuckets.ts`

### Replaced/rewritten
- `src/pages/app/AppJobDetail.tsx` — full rewrite, mobile-first
- `src/pages/app/AppJobApplication.tsx` — slim 2-step sheet
- `src/pages/app/MyApplications.tsx` — tabs + counts

### Touched
- `src/App.tsx` — add `/app/applications/:id` route
- `src/components/jobs/AIJobInsights.tsx` — extract Why-you-match panel for reuse in JobMatchStrip
- `src/lib/creditPricing.ts` — confirm `EXTERNAL_APPLICATION` and `JOB_APPLICATION` costs

---

## Out of scope (saved for 3.5)
- Employer-side updates to applications (admin already has `JobApplicationsManager`)
- Push/email notifications on status change
- Talent-side messaging with recruiters
- Public-facing job detail page (`PublicJobDetail.tsx`) — separate redesign

---

## Open questions

1. **Cover letter polish cost** — keep at 10 credits (same as Application Answers), or bundle into the application fee?
2. **Auto-score on view** — should the match strip auto-spend 10 credits the first time the user opens a job page, or always require explicit tap? (My recommendation: explicit tap — respects the credit economy and avoids surprise charges.)
3. **Withdraw** — soft (marks `withdrawn`, recoverable) or hard (deletes row)? Recommendation: soft.

Approve to proceed.
