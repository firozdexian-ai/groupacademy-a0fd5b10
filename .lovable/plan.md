

# My Courses Tab Optimization

## Problems Identified

1. **Stats cards too large** -- The 3 stat blocks (Active, Completed, Total) are oversized with excessive padding and take up too much vertical space
2. **"Total" stat is redundant** -- Active + Completed = Total; it adds no value
3. **Free videos showing in enrollments** -- Free videos are not real courses; they should only appear in the feed for inline viewing (YouTube promotion)
4. **Course cards too tall** -- The `aspect-video` image ratio + padding makes each card occupy excessive space on mobile
5. **"Browse Catalog" button in empty state navigates away** -- Should switch to the "All Courses" tab instead

## Changes

### 1. Compact the stats row

Replace the 3 large cards with a slim inline summary bar -- two small pill-style indicators side by side:

```text
[ clock icon  2 Active ]  [ check icon  1 Completed ]
```

- Remove the "Total" stat entirely
- Use a single-row flex layout with small rounded pills instead of full Card components
- Much less vertical space consumed

### 2. Filter out free_video enrollments

In the query or the filter logic, exclude enrollments where `content.content_type === "free_video"`. This ensures free videos never appear in My Courses.

### 3. Make course cards more compact

- Change image from `aspect-video` (16:9) to a fixed `h-24` (96px) height
- Reduce card padding from `p-4` to `p-3`
- Remove the hover overlay with "Resume" text (unnecessary on mobile)
- Keep progress bar, WhatsApp group, and certificate buttons but tighten spacing

### 4. Fix empty-state navigation

Change the "Browse Catalog" button in the empty active-courses state to not navigate away but instead inform the user to check the "All Courses" tab (or accept an optional callback prop from LearningHub to switch tabs).

## Technical Details

### File: `src/components/learning/MyCoursesTab.tsx`

**Stats section (lines 147-169):** Replace the 3-card grid with a compact flex row of two styled pills using simple div elements with inline flex layout.

**Enrollment filter (lines 117-118):** Add `.filter(e => e.content.content_type !== "free_video")` to exclude free videos from both active and completed lists.

**LearningCard component (lines 34-97):**
- Line 44: Change `aspect-video` to `h-24` for a shorter image area
- Lines 52-56: Remove the hover overlay div
- Line 58: Reduce padding from `p-4` to `p-3`
- Line 69: Tighten spacing from `space-y-3` to `space-y-2`

**Empty state (line 184):** Update "Browse Catalog" to use an `onBrowse` callback prop so LearningHub can pass tab-switching logic.

**Props:** Add optional `onBrowseCatalog?: () => void` prop to `MyCoursesTab` so the parent (LearningHub) can pass `() => setActiveTab("courses")`.

### File: `src/pages/app/LearningHub.tsx`

Pass `onBrowseCatalog={() => setActiveTab("courses")}` to `<MyCoursesTab />`.

