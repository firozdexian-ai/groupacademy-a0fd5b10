# Phase 11G — Compact Mobile Gig Hub + Autonomous Approval

Two intertwined goals:
1. **Make the Gig Ecosystem screen actually mobile-friendly** (tabs no longer collide at 390px, cards become dense rows, header collapses).
2. **Auto-approve and auto-credit most platform tasks** so the human reviewer is only needed for genuinely ambiguous cases.

---

## Part A — Mobile UI Compaction

### Screen header (`Gigs.tsx`)
- Drop the 5xl italic title for mobile; show a compact header (`text-2xl`) with the verification chip inline (badge instead of full card on <md).
- Remove "Neural Economy Protocol v2.6" tagline on mobile.

### Tab strip (the one that "intercollides")
- 4 tabs in a `grid-cols-4` at `h-16` with `text-[10px]` + 4-letter words + icon overflow at 390px.
- Replace with a horizontally-scrollable pill row (`overflow-x-auto snap-x`) on mobile, icon-only with tooltip; full label appears at `md:`.
- Height drops to `h-11`, padding `p-1`.

### Platform Task cards (`GigCard.tsx`)
- Current card is ~220px tall (icon 14×14, big title, requirements row, footer with badges + button). Convert to a **compact row** on mobile:
  - 1 line title, 1 line description (`line-clamp-1`).
  - Inline reward chip + max-completion progress.
  - Right-aligned arrow; tap row anywhere to open the submission sheet.
  - Drop the decorative Zap watermark and rotating icon hover effects.
- Grid: `grid-cols-1` mobile, `md:grid-cols-2`. Card height target: ~88px.
- Strip the `_` underscore and `CR_REWARD` jargon from labels.

### Projects tab
- Sidebar (`grid-cols-[280px,1fr]`) hides on mobile; replace with a horizontal category chip strip above the list.
- Project card: shrink to ~120px row with title, category chip, credits, bid count.

### Build Academy tab
- Audit `BuildAcademyTab.tsx` for the same density rules (single-column on mobile, smaller hero).

---

## Part B — Autonomous Approval & Credit Disbursement

Goal: when a talent submits a platform task, the system decides automatically whether to approve, reject, or escalate to a human, and credits are disbursed in the same transaction.

### New columns on `gigs`
- `auto_approval_mode` text — one of `manual`, `link_check`, `ai_score`, `event_trigger`.
- `auto_approval_config` jsonb — per-task tuning (min AI score, allowed domains, expected event name, score-to-credit curve).

### New columns on `gig_submissions`
- `ai_score` numeric(4,2) — 0-10 quality score.
- `ai_feedback` text — short reasoning shown to the talent.
- `auto_decision` text — `approved`, `rejected`, `escalated`.
- `processed_at` timestamptz.

### Edge function: `auto-review-gig-submission`
Triggered immediately after a `gig_submissions` insert (via DB trigger calling `pg_net` to invoke the function, or via the client right after insert). Logic per task category:

| Category | Auto check |
|---|---|
| `job_sharing` (Share a Job Lead, Spread the Word, Refer a friend) | Verify the URL is a `groupacademy.online` job/share link with a valid `ref=<talent_id>` query param. Cross-check `referral_logs` / `gig_share_logs` for clicks. Auto-approve when ≥1 verified visit. |
| `content_creation` (Write & publish a feed post, Create a poll, Course review, Salary data point) | Read the linked `feed_posts` / `course_reviews` row owned by the talent. Send title + body to Lovable AI Gateway with `google/gemini-3-flash-preview` and a structured-output tool that returns `{score: 0-10, reasons, flags: [spam, low_effort, off_topic, ok]}`. Map score → credit multiplier (0.5×–1.25× of base reward). Auto-approve at score ≥ 6, auto-reject at < 3, escalate in between. |
| `content_creation` (Upload a free educational video, Translate a resource) | Confirm the referenced asset exists in `course_resources` / `module_resources` and is published. Run a lightweight AI metadata check on title/description quality; same scoring band. |
| `cv_upload` (Help a Friend Get Discovered) | Confirm a new talent row exists with the `referrer_id` matching, plus a parsed CV. Auto-approve. |
| `job_posting` (Submit a verified company lead, Share a Job Lead) | Validate domain + dedupe against existing `companies`/`jobs`; auto-approve unique entries, escalate duplicates. |
| `course_resell` (Recommend a Course) | Verify share log + at least one click; auto-approve. |
| Any task with `auto_approval_mode = 'manual'` | Stays in admin queue (current behavior). |

The function calls a SECURITY DEFINER RPC `finalize_gig_submission(submission_id, decision, score, feedback, credit_amount)` that:
- Writes status, ai_score, feedback.
- Inserts a `credit_transactions` row of type `earned` when approved (no double-credit guard via unique `(gig_submission_id)`).
- Notifies the talent.

### UI surfacing
- Submission form (`GigSubmissionForm.tsx`) shows "Reviewed automatically — usually within a minute" for auto-eligible tasks.
- `MySubmissions.tsx` displays AI score and feedback line when present.
- Admin queue keeps only `escalated` + `manual` items.

### Safety
- Hard caps from `max_completions_per_user` enforced before scoring.
- Same-talent rate limit: max 5 auto-approvals/hour per category to deter farming.
- All AI calls are server-side via the edge function (LOVABLE_API_KEY).

---

## Files

**Edit**
- `src/pages/app/Gigs.tsx` — responsive header, scrollable tabs, mobile category chips.
- `src/components/gigs/GigCard.tsx` — compact row layout, copy cleanup.
- `src/components/gigs/BuildAcademyTab.tsx` — density pass.
- `src/components/gigs/MySubmissions.tsx` — show AI score/feedback.
- `src/components/gigs/GigSubmissionForm.tsx` — auto-review messaging.
- `src/components/dashboard/GigSubmissionsManager.tsx` (admin queue) — filter to escalated/manual only by default.

**Create**
- `supabase/functions/auto-review-gig-submission/index.ts` — orchestrator described above.
- `supabase/migrations/<ts>_gig_autonomous_approval.sql` — new columns, `finalize_gig_submission` RPC, seed `auto_approval_mode` per existing gig, after-insert trigger that calls `pg_net` to invoke the edge function.

---

## Open question
None blocking. After approval I'll implement Part A first (visible immediately on `/app/gigs` at 390px), then Part B (database + edge function + admin queue refresh).
