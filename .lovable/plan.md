# Sub-phase 3.6 — Authoring Feedback Loop

Close the loop from learner data → course authors. Today `instructor-item-analytics` exposes per-item p-values, rubric averages, and `needs_review` flags inside `<ItemBankAnalyticsPanel>`, but authors only see them if they manually open the analytics drawer. 3.6 makes those signals **push** to authors and surfaces them inline in the Module Manager so weak items get fixed.

## Goal

When learners struggle (low p-value items, low-rubric scenarios, weak topics), the platform:
- **Pushes a weekly digest** to course owners + admins listing the top items to revise.
- **Annotates the Module Manager** with inline "needs review" badges so the next click fixes the problem.
- **One-click action**: jump from a flagged item to its editor in the existing pool dialog.

## Scope

### a. Digest aggregator RPC + edge function
- New RPC `get_authoring_review_digest(_module_id, _days)` reusing the same flagging logic from `instructor-item-analytics` but as a SQL function so it can run from cron and the edge function. Returns:
  - `module_id`, `module_title`, `content_id`, `content_title`, `owner_id` (course `instructor_id` if set, else first admin)
  - `summary`: counts of flagged quiz items, flagged scenarios, weak topics
  - `top_items`: up to 10 worst (p-value asc / rubric asc) with id, title, flags, topic_tags
  - `weak_topics`: up to 5 with avg_p_value and learner_mastery_mean
- New edge function `authoring-review-digest` (admin/cron-callable):
  - Modes: `mode="single"` (one module → returns JSON), `mode="course"` (loop a course's modules), `mode="weekly"` (all active courses, send emails).
  - In `weekly` mode, iterates owners, composes one HTML email per owner via the existing native email queue, and writes a row to a new `authoring_digest_log` table for de-dup + admin visibility.

### b. Database
- Migration:
  - `authoring_digest_log (id, owner_id, module_ids[], items_flagged int, period_start, period_end, sent_at, channel)` with RLS: admins read all, owner reads own.
  - Add `instructor_id uuid` to `courses` if not present (nullable; falls back to admin); skip if already there.
  - SQL function `get_authoring_review_digest` (`security definer`, `set search_path = public`) mirroring the edge aggregator's flag rules so both layers agree.

### c. Inline nudges in Module Manager
- New hook `useModuleReviewBadge(moduleId)` calling `get_authoring_review_digest` (single module) and caching for 5 min.
- Update `src/pages/ModuleManagement.tsx`:
  - Next to each module row: a small amber "N items need review" badge (hidden when 0). Click opens the existing `ItemBankAnalyticsPanel` already wired at `analyticsModuleId`.
  - Inside the analytics panel, each flagged item gets a new "Edit item" button that opens the existing pool editor for that quiz/scenario id (re-use existing dialogs; no new editor surface).

### d. Author-facing digest page
- New route `/app/instructor/review-queue` (admin + course-owner gated) showing:
  - This week's digest (calls `authoring-review-digest` with `mode=course` for each course owned)
  - Per-module table with flagged items, last digest sent, "Mark fixed" (optional, soft — just records `times_served=0` reset is out of scope; for v1 it links to the editor).
- Add link in `ModuleManagement` header ("Open review queue").

### e. Weekly cron
- pg_cron job (Sunday 03:00 UTC) → `select net.http_post(...)` to `authoring-review-digest` with `{ mode: "weekly" }` using the service role key from `vault`. Skip if `vault` not configured — leave commented with TODO and a manual "Send weekly digests now" button on the admin Learn → Dean page.

### f. Telemetry
- Log `authoring_digest_sent` and `authoring_item_opened_from_digest` to existing analytics table for 3.8.

## Out of scope
- AI rewrite suggestions for flagged items (Phase 3.7).
- Author-side comparative benchmarking across courses (Phase 3.8 trends).
- Mobile push notifications (only email + in-app badges for v1).

## Data flow

```text
pg_cron (weekly) ──► authoring-review-digest (mode=weekly)
                        │
                ┌───────┴────────┐
                ▼                ▼
      get_authoring_review   notify.groupacademy.online
        _digest (RPC)             (one email per owner)
                                       │
                         authoring_digest_log row written
                                       │
ModuleManagement ──► useModuleReviewBadge ──► same RPC (single module) ──► amber badge + click → ItemBankAnalyticsPanel
```

## Files to create / edit

**New**
- `supabase/migrations/...` — `authoring_digest_log` table + RLS, `get_authoring_review_digest` SQL function, optional `courses.instructor_id`, optional pg_cron job.
- `supabase/functions/authoring-review-digest/index.ts` — single/course/weekly modes + email send.
- `src/hooks/useModuleReviewBadge.ts`
- `src/pages/app/InstructorReviewQueue.tsx` — owner/admin review page.
- `mem://product/authoring-feedback-loop`

**Edit**
- `src/pages/ModuleManagement.tsx` — inline badge, "Edit item" wiring, header link.
- `src/components/learning/ItemBankAnalyticsPanel.tsx` — add per-item "Edit" button that opens existing pool editors.
- `src/App.tsx` — register `/app/instructor/review-queue` route.
- `.lovable/plan.md`, `mem://index.md`

## Approval options
- **continue with 3.6** — ship a–f together (recommended).
- **continue with 3.6.a+c** — backend digest + inline badges only; defer dedicated review-queue page and weekly cron.
