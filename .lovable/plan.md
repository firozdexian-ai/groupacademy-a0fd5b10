# Sub-phase 2.8 — Talent Mirror (Cross-Course Mastery Rollup)

## Goal

Close out Phase 2 by giving every learner a single page — the **Talent Mirror** — that aggregates `talent_skill_profile` across every enrolled course. Today the AdaptiveSnapshotCard (2.6) shows mastery only inside one course. The Mirror answers "Across everything I've studied, what am I strongest at, weakest at, and what's due?".

Read-only over existing tables — no schema changes.

---

## What the page shows

1. **Top strip** — courses tracked, topics tracked, avg mastery, due-now count.
2. **Signal split** — quiz vs scenario contributions (uses `last_source`).
3. **Weakest topics across all courses** (top 5).
4. **Mastery by course** — per-course card with progress bar, due count, top-3 weakest topics, deep link to the course.
5. **Strongest topics** (top 5) — positive reinforcement + portfolio-ready proof.
6. **Empty state** — friendly nudge when no skill profile rows exist yet.

---

## Files

**New**
- `supabase/functions/learner-talent-mirror/index.ts` — POST, JWT-validated, resolves `talents.user_id` → talent_id, aggregates `talent_skill_profile` joined with `content` + `course_modules`. Returns `{ summary, signal_split, courses[], weakest_topics[], strongest_topics[] }`.
- `src/hooks/useTalentMirror.ts` — invokes the function, returns `{ data, loading, error, refresh }`.
- `src/components/learning/TalentMirrorPanel.tsx` — mobile-first card stack (skeleton, error, empty, content states). Uses brand semantic tokens only; mastery tone via `< 0.4` destructive / `< 0.7` amber / else success-green.
- `src/pages/app/TalentMirror.tsx` — route shell with sticky back header, mounts `<TalentMirrorPanel />`.

**Edited**
- `src/App.tsx` — register `/app/talent-mirror` route.
- `src/components/learning/MyCoursesTab.tsx` — add a small "Open Talent Mirror" link below the AdaptiveSnapshotCard so learners can drill from My Hub into the cross-course view.
- `.lovable/plan.md` — mark 2.8 done; Phase 2 = 100%.
- `mem://index.md` + new `mem://product/talent-mirror-cross-course-rollup` memory.

**No DB migrations.**

---

## Edge function detail (`learner-talent-mirror`)

- Auth: `auth.getUser(token)` → require non-null user. Resolve `talent_id` from `talents`.
- Single-pass aggregation in Deno over `talent_skill_profile` rows for that talent.
- Batch lookups: `content` (id, title, slug, thumbnail_url) and `course_modules` (id, title) keyed by the IDs in the profiles.
- For each course: avg mastery, modules count, topics count, due-now count, top-3 weakest topics with module title.
- Global: top-5 weakest and top-5 strongest topics (each row carries course_title + module_title + content_id for deep-linking).
- `signal_split` derived from `last_source` ('quiz' vs 'scenario').

Response shape:
```json
{
  "summary": { "courses": 3, "modules": 14, "topics": 42, "avg_mastery": 0.61, "due_now": 5 },
  "signal_split": { "quiz": 30, "scenario": 12 },
  "courses": [
    { "content_id":"…","title":"AML","slug":"aml","modules":4,"topics":18,
      "avg_mastery":0.42,"due_now":3,
      "weakest":[{"topic_tag":"sanctions","module_title":"…","mastery":0.18}] }
  ],
  "weakest_topics": [{ "topic_tag":"…","module_title":"…","course_title":"…","content_id":"…","mastery":0.12 }],
  "strongest_topics": [ /* same shape */ ]
}
```

---

## Out of scope

- Public/shareable Talent Mirror profile (future SEO + portfolio play).
- Trend lines / mastery-over-time charts (needs a snapshot table — not built).
- Career-track-level rollup (tracks already aggregate enrollments; can layer later).
- Comparison vs cohort (privacy + data prep work).

---

## Execution order

Single batch — function + hook + panel + page + route + My Hub link in one go. After it's live, Phase 2 (Adaptive Learning Engine) closes at 100%.

Reply **continue with 2.8** to ship.