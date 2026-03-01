
# Events Tab & In-Context Navigation Fix

## Problems Identified

1. **Competition detail navigates away from Learning Hub** -- Clicking a competition card in Events tab navigates to `/app/learning/competitions/:slug`, which completely replaces the Learning Hub. The top-level tabs (My Courses, Tracks, All Courses, Events) disappear.
2. **Back button goes to wrong page** -- CompetitionDetail's back button navigates to `/app/learning/competitions` (the standalone Competitions page), not back to the Events tab in Learning Hub.
3. **Course detail also navigates away** -- Same issue: clicking a course leaves the Learning Hub entirely, losing the tab context.
4. **Icon alignment in Events tab** -- The 4 filter icons (All, Webinars, In-Person, Compete) use `flex gap-4` which leaves uneven blank space on the right. Should be evenly distributed.
5. **Duplicate "Submit Entry" button** -- CompetitionDetail shows both an inline Submit Entry button (line 286) and a sticky bottom bar one (line 339) on mobile.

## Solution: Inline Detail Views Within Learning Hub

Instead of navigating to separate pages, load detail views **inline below the persistent tab bar**. The Learning Hub tabs always stay visible.

### Architecture

```text
LearningHub
  [My Courses] [Tracks] [All Courses] [Events]   <-- always visible
  +-------------------------------------------------+
  | Events tab content OR CompetitionDetail inline   |
  | Courses tab content OR CourseDetail inline        |
  +-------------------------------------------------+
```

When a user clicks a competition or course, the tab content area swaps to show the detail view with a back button that returns to the list -- all without leaving the Learning Hub.

## Changes

### 1. Add sub-navigation state to LearningHub (`src/pages/app/LearningHub.tsx`)

- Add state for detail view: `detailView: { type: 'competition' | 'course', slug: string } | null`
- When `detailView` is set, render the detail component inline instead of the tab content, while keeping the tab bar visible
- Pass an `onOpenDetail` callback to EventsTab and CoursesTab
- Pass an `onBack` callback to detail components that clears `detailView`
- The tab bar remains on screen at all times

### 2. Make CompetitionDetail embeddable (`src/pages/app/CompetitionDetail.tsx`)

- Add optional props: `inlineSlug?: string` and `onBack?: () => void`
- When `inlineSlug` is provided, use it instead of `useParams().slug`
- When `onBack` is provided, use it for the back button instead of `navigate('/app/learning/competitions')`
- Remove the standalone page wrapper padding (controlled by parent)
- Fix duplicate Submit Entry: hide inline button on mobile (same pattern as AppCourseDetail)

### 3. Make AppCourseDetail embeddable (`src/pages/app/AppCourseDetail.tsx`)

- Add optional props: `inlineSlug?: string` and `onBack?: () => void`
- Same pattern as CompetitionDetail -- use inline props when available, fall back to router params

### 4. Update EventsTab to use inline navigation (`src/components/learning/EventsTab.tsx`)

- Accept an `onOpenCompetition?: (slug: string) => void` prop
- In CompetitionCard's `onClick`, call `onOpenCompetition(slug)` instead of `navigate()`
- Fix icon alignment: change `flex gap-4` to `grid grid-cols-4` so icons distribute evenly across the width

### 5. Update CoursesTab to use inline navigation (`src/components/learning/CoursesTab.tsx`)

- Accept an `onOpenCourse?: (slug: string) => void` prop
- In course card's `onClick`, call `onOpenCourse(slug)` instead of `navigate()`

### 6. Keep standalone routes working

- The existing routes `/app/learning/competitions/:slug` and `/app/courses/:slug` continue to work for direct URL access (bookmarks, sharing)
- The detail components detect whether they're inline (props) or standalone (router params) and behave accordingly

## Technical Details

### File: `src/pages/app/LearningHub.tsx`

- Add state: `const [detailView, setDetailView] = useState<{ type: 'competition' | 'course'; slug: string } | null>(null)`
- When a tab changes, clear detailView: add `setDetailView(null)` to tab click handler
- In the tab content section:
  - If `detailView?.type === 'competition'`, render `<CompetitionDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />`
  - If `detailView?.type === 'course'`, render `<AppCourseDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />`
  - Otherwise render the normal tab content
- Pass callbacks to EventsTab: `onOpenCompetition={(slug) => setDetailView({ type: 'competition', slug })}`
- Pass callbacks to CoursesTab: `onOpenCourse={(slug) => setDetailView({ type: 'course', slug })}`

### File: `src/components/learning/EventsTab.tsx`

- Add prop: `onOpenCompetition?: (slug: string) => void`
- Line 141: Change `onClick={() => navigate(...)}` to `onClick={() => onOpenCompetition ? onOpenCompetition(competition.slug) : navigate(...)}`
- Line 206: Change `flex gap-4` to `grid grid-cols-4` for even icon distribution

### File: `src/components/learning/CoursesTab.tsx`

- Add prop: `onOpenCourse?: (slug: string) => void`
- In course card click handler: use `onOpenCourse` callback when available, fall back to navigate

### File: `src/pages/app/CompetitionDetail.tsx`

- Add optional props interface: `{ inlineSlug?: string; onBack?: () => void }`
- Use `inlineSlug || useParams().slug` for the slug
- Use `onBack || (() => navigate('/app/learning/competitions'))` for back button
- Add `hidden md:block` to inline Submit Entry button (line 283-326) to fix duplicate on mobile

### File: `src/pages/app/AppCourseDetail.tsx`

- Add optional props: `{ inlineSlug?: string; onBack?: () => void }`
- Use `inlineSlug || useParams().slug` for the slug
- Use `onBack || (() => navigate(-1))` for back button

### No database changes required
### No new dependencies required
