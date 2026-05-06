# Phase 2 Recap + Phase 3 Plan — Adaptive Learning Engine

## Phase 2 status: 100% shipped

| # | Sub-phase | Outcome |
|---|---|---|
| 2.1 | Item bank | `module_quiz_pool` + `module_scenario_pool` with quality, difficulty, topic tags |
| 2.2 | Adaptive sampling | `learner-quiz-pool` + `learner-scenario-pool` weight items by mastery, freshness, p-value |
| 2.3 | Skill profile + EWMA trigger | `talent_skill_profile` with EWMA mastery per (talent, module, topic) |
| 2.4 | Spaced repetition (a–f) | SM-2 scheduling, `due_at`, review queue endpoint, "X due" pill, `notify-review-due` |
| 2.5 | Scenario evaluation → skill signal | `learner-scenario-evaluate` (Gemini) → JSON v1 evaluation → mastery via `last_source='scenario'` |
| 2.6 | Adaptive learner dashboard widget | `AdaptiveSnapshotCard` on My Hub + per-course player |
| 2.7 | Instructor analytics for item bank | `instructor-item-analytics` + `ItemBankAnalyticsPanel` in Module Manager (p-values, rubric avgs, needs_review) |
| 2.8 | Talent Mirror cross-course rollup | `learner-talent-mirror` + `/app/talent-mirror` with strongest/weakest topics across all enrollments |

**Engine state today**: every quiz answer and every scenario run flows into `talent_skill_profile` → drives sampling, scheduling, dashboards, and instructor diagnostics. Read paths exist for both learner and admin. No external data is leaving the platform yet (no employer signals, no credentials, no peer comparison).

---

# Phase 3 — Activate the Engine

Phase 2 made mastery *measured* and *visible*. Phase 3 turns it into something that **changes outcomes**: personalised next steps for the learner, durable proof for the outside world, and a feedback loop into authoring.

## Proposed sub-phases

| # | Sub-phase | Why it's next |
|---|---|---|
| 3.1 | Next-Best-Action recommender | Today the learner sees mastery; they don't see *what to do next*. Compute a per-talent ranked list (review N due topics, finish module X, take scenario Y) surfaced on Dashboard + My Hub. |
| 3.2 | Verifiable Skill Credentials | Promote `talent_skill_profile` rows that cross a mastery + attempts threshold into immutable, shareable credentials (extends existing `verifiable-certificate` system). |
| 3.3 | Talent Mirror → Public Profile | Opt-in public version of `/app/talent-mirror` (slug-based, server-rendered for SEO), surfacing strongest topics + earned credentials. Hooks into existing portfolio. |
| 3.4 | Mastery-driven Job Match | Inject `talent_skill_profile` topic strengths into the existing inclusive jobs scoring; show "matches your strengths" badges + a "Skills you'd need" drill-down on job cards. |
| 3.5 | AI Tutor with mastery context | Extend the AI Instructor chat to load the learner's weakest-3 topics + last failed quiz items as system context, so it teaches what the learner actually needs. |
| 3.6 | Authoring feedback loop | Daily admin digest (and inline nudges in Module Manager) of items flagged by 2.7's `needs_review` — closing the loop from analytics → fix → re-test. |
| 3.7 | Cohort & peer benchmarks | Anonymised cohort percentile per topic (privacy-safe min-N gate), shown on AdaptiveSnapshotCard + Talent Mirror. |
| 3.8 | Mastery snapshots & trend lines | Nightly snapshot table → 30/90-day mastery trend on the Mirror; powers retention emails ("you've grown 14% this month"). |

That's 8 sub-phases following the same rhythm as Phase 2 (small, shippable, end-to-end slices). My recommended order: **3.1 → 3.6 → 3.5 → 3.2 → 3.3 → 3.4 → 3.8 → 3.7** (start with what changes learner behaviour today, end with the longer-arc retention/proof items).

---

## Sub-phase 3.1 — Next-Best-Action Recommender (proposed first slice)

### Goal
A single ranked list of "what to do next" for the authenticated talent, computed from mastery + due dates + enrollment progress + scenario availability. Replaces the implicit "X due" pill with explicit actions.

### Mini sub-phases

| # | Scope |
|---|---|
| 3.1.a | Edge fn `learner-next-actions` returns 3–5 ranked actions with type, target ids, reason text, and a CTA route. |
| 3.1.b | `useNextActions` hook + `NextActionsCard` (mobile-first stack of action chips with iconography per type). |
| 3.1.c | Mount above AdaptiveSnapshotCard on My Hub, and as a compact horizontal strip on the main Dashboard. |
| 3.1.d | Empty / cold-start state — direct to "browse academy" or "complete onboarding". |

### Action types (initial)
- `review_due` — N topics due now → `/app/learning/review`
- `practice_weakness` — your weakest topic in course X → opens that module's quiz
- `finish_module` — you started this module — finish it
- `take_scenario` — scenario item you haven't tried in a module where you're 60–80% mastery (closes the gap to mastery)
- `cool_down_strongest` — opt-out of suggestions for topics already > 0.85 mastery

### Scoring (server-side, single function)
For each candidate action `a`, score = `weight(type) + urgency(due_at) + impact(1 - current_mastery) + recency_penalty(last_seen_at)`. Cap at 5 actions. Diversify across courses where possible.

### Files (3.1)
**New**
- `supabase/functions/learner-next-actions/index.ts`
- `src/hooks/useNextActions.ts`
- `src/components/learning/NextActionsCard.tsx`

**Edited**
- `src/components/learning/MyCoursesTab.tsx` — mount above AdaptiveSnapshotCard
- `src/pages/Dashboard.tsx` (or appropriate dashboard surface) — compact variant
- `.lovable/plan.md` — Phase 3 progress block
- `mem://index.md` + new memory `mem://product/next-best-action-recommender`

**No DB schema changes for 3.1.** (3.8 will introduce a snapshot table; 3.2/3.7 will introduce credential + cohort tables.)

---

## What I need from you to proceed

1. **Confirm Phase 3 scope** — keep all 8 sub-phases, or trim/reorder?
2. **Confirm starting slice** — proceed with **3.1 a–c** in one batch (recommended), or just **3.1.a** first?
3. **Anything to add** before we lock the sequence — e.g. Telegram/email push of the next action, B2B employer-facing version, etc.

Reply **continue with 3.1** to ship the recommender (a–c) end to end, or send adjustments and I'll re-plan.