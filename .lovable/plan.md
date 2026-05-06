## Sub-phase 1.6 — Course Performance Dashboard

A new **Performance** tab inside `ContentEdit` giving admins per-course analytics: enrollment funnel, completion stats, quiz/scenario pool health, and per-module drop-off. Read-only, fully client-aggregated from existing tables — no schema changes.

---

### 1. New tab in ContentEdit

`src/pages/ContentEdit.tsx`
- Add `<TabsTrigger value="performance">Performance</TabsTrigger>` next to Schema/Sessions.
- Add `<TabsContent value="performance">` rendering the new component:
  ```tsx
  {id && <CoursePerformanceDashboard contentId={id} contentTitle={formData.title} />}
  ```

### 2. New component — `src/components/dashboard/CoursePerformanceDashboard.tsx`

Composed of 5 cards in a responsive grid (matches existing rounded-3xl / muted header style):

1. **KPI strip** — 4 stat tiles
   - Enrollments (total)
   - Active learners (last 7d via `enrollments.last_accessed_at`)
   - Completion rate (`status = 'completed' / total`)
   - Avg progress (`avg(progress)`)

2. **Enrollment funnel** — horizontal bars
   - Enrolled → Started (`progress > 0`) → Mid (`>= 50`) → Completed (`status='completed'`)

3. **Per-module drop-off** — table of `course_modules` (ordered by `display_order`) with:
   - Learners who reached this module (count where `enrollments.current_module_id = m.id` OR passed it)
   - Quiz attempts (`talent_quiz_attempt` count + avg score)
   - Scenario runs (`talent_scenario_run` count + avg `evaluation->>score`)
   - Drop-off %

4. **Pool health** — for each module, two compact rows:
   - Quiz pool: size, avg `quality_score`, total `times_served`, low-quality count (`quality_score < 0`)
   - Scenario pool: same metrics
   - Color chip: green (≥20 quiz / ≥10 scenarios), amber, red.

5. **Recent activity** — last 10 rows across `enrollments`, `talent_quiz_attempt`, `talent_scenario_run` with timestamp + talent name.

### 3. Data layer — `src/lib/coursePerformance.ts`

Single hook `useCoursePerformance(contentId)` that fires parallel queries:

```ts
const [enrollments, modules, quizAttempts, scenarioRuns, quizPool, scenarioPool]
  = await Promise.all([
    supabase.from("enrollments").select("id,status,progress,current_module_id,last_accessed_at,enrolled_at,talent_id").eq("content_id", contentId),
    supabase.from("course_modules").select("id,title,display_order").eq("content_id", contentId).order("display_order"),
    supabase.from("talent_quiz_attempt").select("id,module_id,score,created_at,talent_id").in("module_id", moduleIds),
    supabase.from("talent_scenario_run").select("id,module_id,evaluation,created_at,talent_id").in("module_id", moduleIds),
    supabase.from("module_quiz_pool").select("module_id,quality_score,times_served").in("module_id", moduleIds),
    supabase.from("module_scenario_pool").select("module_id,quality_score,times_served").in("module_id", moduleIds),
  ]);
```

Aggregations done in-memory (volumes are small per course). Returns a typed `CoursePerformance` object consumed by the dashboard.

### 4. Export

A "Download CSV" button in the dashboard header that flattens the per-module table via `papaparse` (already in deps — fallback to manual CSV string if not) and triggers a Blob download.

### 5. Empty / loading states

- Skeleton cards while loading.
- Empty state: "No enrollments yet" with a link to share the course.

### 6. Permissions

- Tab only mounts; data queries already protected by existing RLS (admin role can read these tables). No new policies needed.

---

### Files

**New**
- `src/components/dashboard/CoursePerformanceDashboard.tsx`
- `src/components/dashboard/performance/KPIStrip.tsx`
- `src/components/dashboard/performance/EnrollmentFunnel.tsx`
- `src/components/dashboard/performance/ModuleDropoffTable.tsx`
- `src/components/dashboard/performance/PoolHealthCard.tsx`
- `src/components/dashboard/performance/RecentActivityList.tsx`
- `src/lib/coursePerformance.ts`

**Edited**
- `src/pages/ContentEdit.tsx` — add Performance tab.

### Out of scope (later phases)
- Time-series charts (weekly enrollments, retention curves).
- Cohort analysis / per-traffic-source breakdown.
- Per-talent drill-down view.
- Server-side materialized views (only needed once per-course volume > 10k rows).