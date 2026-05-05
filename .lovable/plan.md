## Phase 10 — Course Enrollment, Active Catalog Hygiene, and Affiliate Sharing Loop

I found two separate causes behind the current breakage:

1. The talent app enrollment flow is still split between two identity models. New code checks `talent_id`, but the course player/details route still checks `student_id`. Also, the enrollment insert is currently sending `student_id = talent.id`, which does not match the `students.id` foreign key. That explains the “sync failed / unable to sync” behavior and why reserving a seat still does not complete.
2. “Active course” is not enforced consistently. Admin outreach, public catalog, talent catalog, and gig/course sharing each query content differently, so old/incomplete/published-but-not-ready content can leak into some places.

### 1. Fix enrollment as one atomic backend action

Create a secure backend RPC, for example `enroll_in_content(p_content_id uuid, p_ref_code text default null)`, that becomes the single way to enroll in any course type:

- Resolve the logged-in user to both:
  - their `talents.id`
  - their matching `students.id`
- Validate the course is actually enrollable:
  - `is_published = true`
  - `is_private = false`
  - `is_ready = true`
  - live/batch/offline events must not be expired
  - capacity must not be full
- Determine the course cost using the explicit `content.credit_cost` first.
- Deduct credits and insert/update enrollment in one transaction.
- Insert enrollment with both correct IDs:
  - `student_id = students.id`
  - `talent_id = talents.id`
- Increment `current_enrollment` only when a new active enrollment is created.
- Return the enrollment id, status, cost, remaining balance, and WhatsApp link if applicable.

This removes the current risk where credits can be deducted before the enrollment insert fails.

### 2. Repair course/player access for talent users

Update these app surfaces to use the same enrollment source of truth:

- `useEnrollment.ts`
- `WebinarEnrollPanel.tsx`
- `AppCourseDetail.tsx`
- `ImmersiveCoursePlayer.tsx`
- module/resource loading hooks where needed

Specific behavior:

- “Reserve seat” and “Enroll” will call the new RPC instead of manual insert + separate credit deduction.
- The player will accept enrollment by `talent_id` and no longer fail because it only searched by `student_id`.
- The module “see details / open module” action will route through enrollment state. If not enrolled, it shows an “Enroll first” CTA instead of a sync failure.
- Live course CTA copy becomes `Enroll / Reserve seat` consistently, and enrolled users see:
  - `You're registered`
  - WhatsApp group button if available
  - next-step instructions.

### 3. Standardize active course rules across the platform

Introduce one reusable active-content rule for courses, webinars, batches, and seminars.

Active means:

- Published
- Not private
- Ready
- For recorded courses: has curriculum content
  - at least one module, and
  - at least one usable resource/video in the course
- For live/batch/offline events: has `event_date`, and event is not more than the configured grace window in the past
- Not sold out if capacity is set

Then apply that rule to:

- Talent app academy catalog
- Course detail route
- Public courses page
- Public webinar landing page
- Admin content outreach dropdown
- Gig sharing course selector
- Course share/affiliate surfaces

### 4. Auto-mark incomplete recorded courses inactive

Add a backend readiness function/trigger that keeps `content.is_ready` aligned for recorded courses:

- Recorded course becomes ready only when it has at least one module and usable course material.
- If modules/resources are missing, it becomes inactive (`is_ready = false`) even if it is technically published.
- Live/batch/offline readiness stays based on published + event date, but expired events will no longer appear in acquisition surfaces.

I will also add a one-time cleanup/backfill so existing incomplete recorded courses stop appearing everywhere immediately.

### 5. Fix admin Content Outreach

Update `ContentOutreachManager.tsx` so the dropdown only shows active, marketable content:

- recorded courses that are truly ready
- live webinars / batches that are upcoming or still in grace period
- no incomplete drafts
- no expired sessions
- no old thousands of inactive course records

Also improve labels so admins can see:

- content type
- credit cost
- event date for live content
- readiness state if needed

### 6. Convert “share a course” gig into a true affiliate loop

Build a dedicated `course_resell` / course affiliate flow instead of overloading the current job-sharing form.

Backend additions:

- `course_affiliate_clicks` table to track visits from unique referral links
- `course_affiliate_conversions` table or equivalent transaction record to prevent duplicate payouts
- secure function to track `?ref=` clicks on public course/webinar links
- secure function to award affiliate credits when a referred user successfully enrolls

Reward rule:

- On verified enrollment through a referral link, award the sharer either:
  - 10 credits fixed, or
  - 10% of the course credit cost
- Based on your example, I will implement fixed `10 credits per enrolled buyer` by default, with a backend config field so it can be changed later.
- If 20 people enroll through one link, the sharer gets 20 × 10 = 200 earned credits.
- Prevent self-referrals and duplicate payouts for the same referred user + course.

Frontend behavior:

- Add a proper course-sharing gig form.
- It only lists active/enrollable courses, not every course in the system.
- Generates a unique link like:
  - `/courses/:slug?ref=USER_CODE`
  - `/webinar/:slug?ref=USER_CODE`
- Provides WhatsApp, LinkedIn, Facebook, Telegram, and copy link actions.
- Shows simple tracking status in My Submissions: clicks, enrollments, earned credits.

### 7. Preserve onboarding acquisition loop

Make sure the public webinar/course acquisition flow closes cleanly:

1. Visitor lands from an affiliate/referral link.
2. `ref` is captured safely.
3. Visitor signs up or logs in.
4. Welcome credits are available.
5. User taps Enroll / Reserve seat.
6. Credits are deducted only if enrollment succeeds.
7. User sees WhatsApp/next-step details.
8. Referrer receives affiliate credit after successful enrollment.

### Files likely to change

- `supabase/migrations/<new>.sql`
- `src/hooks/useEnrollment.ts`
- `src/components/learning/WebinarEnrollPanel.tsx`
- `src/pages/app/AppCourseDetail.tsx`
- `src/pages/ImmersiveCoursePlayer.tsx`
- `src/components/learning/CoursesTab.tsx`
- `src/components/learning/EventsTab.tsx`
- `src/pages/PublicCourses.tsx`
- `src/pages/CourseDetail.tsx`
- `src/pages/public/WebinarLanding.tsx`
- `src/components/dashboard/ContentOutreachManager.tsx`
- `src/components/gigs/GigSubmissionForm.tsx`
- new `src/components/gigs/CourseSharingGigForm.tsx`
- `src/components/gigs/MySubmissions.tsx`
- `src/lib/creditPricing.ts`

### Immediate data cleanup included

After the schema/function changes, I will also include safe cleanup logic so current bad data stops showing:

- expired live/batch items no longer appear in user/admin sharing surfaces
- incomplete recorded courses are marked not-ready
- the urgent webinar/course can be set to the intended credit cost through `credit_cost` so 250 welcome credits can cover it

### Expected result

After this phase:

- You can enroll/reserve a seat successfully.
- Opening course/module details no longer shows sync failure.
- Only genuinely active courses appear in talent app, admin outreach, public pages, and gigs.
- Incomplete recorded courses are inactive across the system.
- “Share a course” becomes a real affiliate channel with unique links and automatic 10-credit rewards per successful enrollment.