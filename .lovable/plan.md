# Phase 12B — Consolidated UI Refresh & Career Tools

Combines the **carry-over from Phase 12A** (Jobs Hub Tools + Locations) with **new feedback** on Learning Hub naming, Feed UI, filters, and PostCard cleanup.

---

## 1. Learning Hub — Final 4-Tab Structure

`src/pages/app/LearningHub.tsx`

Rename and restructure tabs to:

| Tab | Contains |
|---|---|
| **My Hub** | Active & completed enrollments (unchanged) |
| **Career Path** | Schools / professions browser (unchanged) |
| **Academy** | Courses + Live Programs (webinars/batches) + In-person Events + Competitions |
| **Study Abroad** | (renamed from "Arena") Country specialists, universities, IELTS prep, roadmap tools |

Changes:
- Rename tab key `events` → `academy-events` is **not** needed; instead split current tabs:
  - Move **In-person events** and **Competitions** from current `EventsTab` **into Academy** (new sub-pills inside `CoursesTab`/Academy view).
  - Repurpose the 4th tab as **Study Abroad** rendering only `StudyAbroadSection` (no in-person/compete pills).
- Update `tabs` array: `my-courses`, `tracks`, `academy`, `study-abroad`. Icons: BookOpen, Target, Library, Globe.
- `CoursesTab` becomes an **Academy shell** with internal sub-pills: **Courses · Live Programs · Events · Compete** (compact pill row, no horizontal scroll — wraps to 2 rows if needed on mobile).
- Drop the page-level `<BannerCarousel placement="learning" />` (user noted Home has none; keep Learning consistent — remove the banner block).
- Header text becomes `Learn` not `Academy` to avoid clashing with the Academy tab.

## 2. Career Path UI Consistency

`src/components/learning/TracksTab.tsx`

- Replace 5-column category strip with the same compact pill style used in AI Agents filter (icon + label, wraps, no horizontal scroll).
- Use single accent color (primary) — drop emerald-only completed cards in favor of the standard `Badge` pattern used elsewhere.
- Match card radius (`rounded-2xl`), padding (`p-3`), and typography (`text-sm` titles, `text-[11px]` meta) used in Academy cards for visual consistency.

## 3. Feed Overhaul

### 3a. `src/pages/app/Feed.tsx`
- Confirm `BannerCarousel` is **not** rendered (already removed) — keep Feed banner-free per Home parity.
- Pinned post: render through the same compact `PostCard` redesign (no special legacy styling).

### 3b. `src/components/feed/FeedFilters.tsx` — kill horizontal scroll
- Remove `overflow-x-auto` + `min-w-max` pattern.
- Show first **4 filters inline** (`All`, `Posts`, `Courses`, `Videos`) + a **"More" button** that opens a popover/sheet with the rest (`Polls`, `Articles`).
- Mirror the AI Agents filter "More" pattern (`AgentFilters.tsx`) for visual consistency.
- Compact: `py-2`, no large telemetry counter badges — use a small inline `(N)` after the label.

### 3c. `src/components/feed/PostCard.tsx` — strip "previous words"
- Remove all sci-fi/terminal labels (`NEURAL_TIP`, `MARKET_INTELLIGENCE`, `INSTITUTIONAL_LOG`, `COMMUNITY_CONSENSUS`, etc.) — replace with plain English: `Tip`, `News`, `Announcement`, `Poll`.
- Reduce padding to `p-3`, title `text-sm font-semibold`, meta `text-[11px]`.
- Replace `AspectRatio` 16:9 hero media with a constrained `max-h-64 rounded-xl` image.
- Simplify reaction bar to icon-only with subtle counts.
- Remove decorative gradients/borders; align with `FeedCardRedesigned` density.

### 3d. `src/components/feed/QuickActionsGrid.tsx` — already 4-col, verify
- Ensure exactly 4 visible tiles (3 dynamic agents + Messages), no horizontal scroll.

## 4. Jobs Hub — Carry-over from Phase 12A

`src/pages/app/JobsHub.tsx` (talent-side)

- **Replace "Agents" tab with "Tools" tab** containing:
  - **ATS-Friendly CV Maker** → new `src/pages/app/tools/CVMaker.tsx`
  - **Application Answer Sheet** → new `src/pages/app/tools/ApplicationHelper.tsx`
- **Locations tab**: pin user's residency country (from `talent.country`) at top with "Your country" badge.
- New edge function `supabase/functions/generate-application-answers/index.ts` (Lovable AI Gateway, Gemini 2.5 Flash).
- Add `CV_GENERATION` (15) + `APPLICATION_ANSWERS` (10) to `src/lib/creditPricing.ts` (already done in Phase 12A — verify).

## 5. UI Consistency Tokens

Establish a shared compact pattern used across Feed, Learning, Jobs:

```text
Card:     rounded-2xl  border-border/40  p-3
Title:    text-sm font-semibold
Meta:     text-[11px] text-muted-foreground
Pills:    h-9 rounded-xl text-xs (no horizontal scroll, wraps)
Banners:  removed from Feed + Learning page shells
Badges:   plain English labels, no UPPERCASE_TERMINAL style
```

Apply audit pass to: `PostCard`, `FeedCardRedesigned`, `TracksTab`, `CoursesTab`, `MyCoursesTab`, `EventsTab`, `JobCard`.

---

## Files Changed

**New**
- `src/pages/app/tools/CVMaker.tsx`
- `src/pages/app/tools/ApplicationHelper.tsx`
- `supabase/functions/generate-application-answers/index.ts`

**Modified**
- `src/pages/app/LearningHub.tsx` (4-tab rename, drop banner, Study Abroad tab)
- `src/components/learning/TracksTab.tsx` (pill consistency)
- `src/components/learning/CoursesTab.tsx` (Academy shell with sub-pills)
- `src/components/learning/EventsTab.tsx` (slim to Study Abroad-only OR delete and inline `StudyAbroadSection`)
- `src/components/feed/FeedFilters.tsx` (4 + More button, no scroll)
- `src/components/feed/PostCard.tsx` (densify, plain labels)
- `src/components/feed/QuickActionsGrid.tsx` (verify 4-col cap)
- `src/pages/app/JobsHub.tsx` (Agents → Tools tab, pinned country)
- `src/lib/creditPricing.ts` (verify CV_GENERATION/APPLICATION_ANSWERS)

## Out of Scope
- Admin Jobs Hub (`src/components/dashboard/jobs-hub/JobsHub.tsx`) — terminal styling kept for admin; talent-facing only.
- New backend tables (none needed beyond Phase 12A's `instructor_connection_requests`).

**Approve to proceed with Phase 12B implementation?**