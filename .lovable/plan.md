# Phase 9 — Enrollment Integrity & Live Program Hygiene

Three concrete bugs reported on `/dashboard?tab=webinars` and `/app/learning/courses/...`. Root causes confirmed via DB inspection.

## 1. Past live programs still surfacing

The "AI Efficiency Accelerator (Batch 2)" has `event_date = 2025-12-05` (already passed) but is still rendered as "Starts Dec 6" because `CoursesTab` only filters by `is_published / is_ready` and never compares against `now()`.

**Fix** (`src/components/learning/CoursesTab.tsx`):
- For `live_webinar` and `batch_class`, filter out rows whose `event_date` is more than 2 hours in the past (small grace window so an in-progress webinar still appears).
- Apply the same rule to `offline_seminar` cards (events tab).
- Sort live programs ascending by `event_date` so the next session is first.

Recorded courses (`recorded_course`) are unaffected — they have no event date.

## 2. "Sync failed" inside courses, cannot enroll

Confirmed RLS gap on `public.enrollments`:

```text
Students can insert own enrollments
  → WITH CHECK: EXISTS (SELECT 1 FROM students
                        WHERE students.id = enrollments.student_id
                          AND students.user_id = auth.uid())
```

`WebinarEnrollPanel` (and the upcoming generic enroll flow) insert with `student_id = talent.id` and `talent_id = talent.id`. Since `talents.id ≠ students.id`, the policy denies the insert and the UI surfaces a generic "Sync failed" toast. There is also no SELECT policy that lets a talent read their own enrollment row, so the "already enrolled?" lookup always returns null.

**Fix — migration**: add talent-scoped RLS policies on `enrollments`:

```sql
CREATE POLICY "Talents can view own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talents t
                 WHERE t.id = enrollments.talent_id
                   AND t.user_id = auth.uid()));

CREATE POLICY "Talents can insert own enrollments"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.talents t
                      WHERE t.id = enrollments.talent_id
                        AND t.user_id = auth.uid()));

CREATE POLICY "Talents can update own enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talents t
                 WHERE t.id = enrollments.talent_id
                   AND t.user_id = auth.uid()));
```

**Fix — capacity counter race**: `WebinarEnrollPanel` does a manual `update content set current_enrollment = current_enrollment + 1`. Replace with a SECURITY DEFINER RPC `increment_content_enrollment(p_content_id uuid)` so non-admins can update only that one column atomically without needing UPDATE privilege on `content`.

**Fix — error surface**: in `WebinarEnrollPanel.handleEnroll`, surface the actual Postgres error message instead of swallowing it, so the next regression is debuggable from the toast.

## 3. Unify "Start course" → "Enroll"

`AppCourseDetail.tsx` (line 137) hard-codes "Start course" inside the certificate card. For recorded courses the user must enroll first; for live programs the dedicated `WebinarEnrollPanel` already handles registration, so this card should not double up.

**Fix** (`src/pages/app/AppCourseDetail.tsx`):
- Hide the "Start course" CTA inside the certificate card when an enrollment row does not yet exist; render an "Enroll" CTA instead that:
  - Recorded course → calls `deductCustomAmount` then inserts an `enrollments` row, then routes to `/app/learn/:slug`.
  - Live webinar / batch → defers entirely to `WebinarEnrollPanel` (hide duplicate CTA).
- After successful enrollment, the same button flips to "Continue learning" and routes to the player.
- Pull enrollment lookup into a small `useEnrollment(courseId)` hook so both the certificate card and the webinar panel share the same source of truth and stay in sync via React Query invalidation.

## Out of scope

- Admin-side bulk archival of past events (separate cleanup task).
- Refund / deposit logic for cancelled live sessions.

## Files to touch

- `supabase/migrations/<new>.sql` — three RLS policies + `increment_content_enrollment` RPC.
- `src/components/learning/CoursesTab.tsx` — date filter + sort for live/event cards.
- `src/components/learning/WebinarEnrollPanel.tsx` — RPC for capacity, real error toast.
- `src/pages/app/AppCourseDetail.tsx` — unified Enroll CTA, dedupe with webinar panel.
- `src/hooks/useEnrollment.ts` (new) — shared enrollment lookup + mutation.
