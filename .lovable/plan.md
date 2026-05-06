## Phase 4.4 — Gro10x Learning Ops (B2B) ✅ shipped

Schema: extended `company_course_assignments` (cohort_id, talent_id, enrollment_id, status, budget_credits, completed_at, overdue_at); `cohorts.sponsor_company_id`; `enrollments.assignment_id` + `sponsor_company_id`; new `company_learning_seats`.

Triggers: `on_org_assignment_created` debits company wallet; `on_sponsored_enrollment_completed` closes assignment.

RPCs: `org_assign_talents`, `org_learning_health`, `org_team_mastery`, `org_mark_overdue`.

Edges: `notify-org-learning`, `cron-org-learning-sweeps` (hourly via pg_cron).

UI:
- `/gro10x/learn/ops` — Overview / Assignments / Catalog / Team / Wallet tabs.
- Admin Learn → **B2B Engagements** tab.
- `useOrgLearning.ts` hook bundle.

Next: 4.5 — branded company tracks / catalog curation, or 4.6 — AI assignment recommender.
