# Sub-phase 2.2 — Progress Engine

Goal: a single authoritative source of truth for learner progress, auto-computed from stage events, that powers enrollments.progress, dashboards, certificates (2.4), and streaks (2.5).

Today the codebase has two parallel progress paths (`useStageProgress` writes `enrollment_stage_progress` + manual % math; `useCourseProgress` derives from `student_resource_progress`). They drift. Phase 2.2 unifies both behind a DB-side engine.

---

## 2.2 mini sub-phases

| # | Sub-phase | Outcome |
|---|---|---|
| 2.2.a | Schema: `module_progress` + indexes + RLS | Per-(enrollment, module) row with stages_completed, %, started_at, completed_at |
| 2.2.b | DB triggers: auto-recompute | On `enrollment_stage_progress` upsert → recompute matching `module_progress` row + parent `enrollments.progress` + auto-flip enrollment status to `completed` |
| 2.2.c | Backfill migration | Populate `module_progress` from existing `enrollment_stage_progress` and legacy `student_resource_progress` |
| 2.2.d | Unified hook `useProgress` | Replaces split between `useStageProgress` + `useCourseProgress`; reads from `module_progress` view, writes only stage events |
| 2.2.e | UI rewire (no behavior change) | Player, Enrollments page, dashboard "Continue learning" rail consume `useProgress` |
| 2.2.f | Completion event hook | Emits `course_completed` notification + sets `enrollments.completed_at`; certificate handoff stub for 2.4 |

We will plan/approve/build each in order. Below is the full 2.2 plan; implementation lands a-then-b-then-c… in one or two PR-sized chunks per your preference.

---

## Detailed plan

### 2.2.a — Schema

```sql
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  stages_completed int[] not null default '{}',
  total_stages int not null default 6,
  progress_pct int not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (enrollment_id, module_id)
);

create index module_progress_enrollment_idx on public.module_progress(enrollment_id);
alter table public.module_progress enable row level security;
```

RLS: learner reads own (`enrollment.talent_id = auth.uid()` via existing `is_enrolled_in_module`); admins read via `has_role(auth.uid(),'admin')`. No client writes (trigger-only).

### 2.2.b — Triggers

```text
enrollment_stage_progress  ──AFTER INSERT/UPDATE──▶  fn_recompute_module_progress()
                                                         │
                                                         ├─ upsert module_progress row
                                                         │  (stages_completed, pct = card(stages)/total*100,
                                                         │   started_at on first stage, completed_at when full)
                                                         │
                                                         └─ recompute enrollments.progress =
                                                              avg(module_progress.progress_pct) across course modules
                                                              + flip status='completed', completed_at=now()
                                                                when all modules done
```

All functions: `language plpgsql security definer set search_path = public`.

### 2.2.c — Backfill

One-shot in the same migration:
- For every existing row in `enrollment_stage_progress`, call the trigger fn manually to seed `module_progress`.
- For legacy `student_resource_progress` data without `enrollment_stage_progress` rows, derive completed stages by grouping `(student_id, module_resources.module_id, stage_number)` and resolving `enrollment_id` via `enrollments.talent_id = student_id and content_id = module.content_id`.

### 2.2.d — Unified hook

`src/hooks/useProgress.ts` (new) — single API:
```ts
useProgress({ enrollmentId, contentId })
  → { modules: ModuleProgress[], overallPct, isCompleted,
      currentModuleId, currentStage,
      markStageComplete(moduleId, stage), isStageUnlocked, isResourceViewed, markResourceViewed,
      reload }
```
Reads from `module_progress` (joined with `course_modules` for ordering) + `enrollment_stage_progress.resource_view_states` for per-resource flags. Writes go to `enrollment_stage_progress` only — engine derives the rest.

Realtime: subscribe to `module_progress` changes for current enrollment so multi-tab stays in sync.

### 2.2.e — UI rewire (no UX change)

- `ImmersiveCoursePlayer.tsx`: swap `useStageProgress` + `useCourseProgress` for `useProgress`.
- `Enrollments.tsx` + dashboard "Continue learning" rail: drop manual progress math, read `module_progress.progress_pct` / `enrollments.progress`.
- Delete dead local % math inside `useStageProgress` (kept temporarily as thin shim re-exporting from `useProgress` to avoid blast radius, removed in 2.2.f).

### 2.2.f — Completion handoff

- DB trigger emits a `notifications` row `type='course_completed'` once `enrollments.status` flips to `completed`.
- Add `course_completed_at` index for 2.4 (certificates) and 2.5 (streaks) consumers.
- Remove the legacy `useStageProgress` shim once player + dashboard are migrated.

---

## Files

**Migrations**
- `module_progress` table + RLS + indexes
- `fn_recompute_module_progress`, `fn_recompute_enrollment_progress`, triggers on `enrollment_stage_progress`
- Backfill block

**New**
- `src/hooks/useProgress.ts`

**Edited**
- `src/pages/ImmersiveCoursePlayer.tsx`
- `src/pages/Enrollments.tsx`
- `src/components/dashboard/*` (continue-learning rail)
- `src/hooks/useStageProgress.ts` → shim, then deleted
- `src/hooks/useCourseProgress.ts` → deleted

---

## Out of scope (next sub-phases)
- Adaptive difficulty (2.3)
- Certificates on completion (2.4)
- Streaks/goals (2.5)

---

Reply **continue with 2.2.a** to start with the schema migration, or **continue 2.2 a–c** to ship schema + triggers + backfill in one batch (recommended).
