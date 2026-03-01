

# Events Detail View -- Compact & Aligned Redesign

## Problems Identified

From the current Competition Detail page on mobile:

1. **Oversized layout** -- The `md:grid-cols-3` grid creates separate full-width Card blocks for "About", "Rules", "Key Info", and "Prizes" that each take up excessive vertical space with large padding
2. **Cards within cards** -- Each section is wrapped in a `Card > CardHeader > CardContent` pattern that adds ~48px padding per section, making everything feel bloated on mobile
3. **Prizes section is hollow** -- Shows just numbers (1, 2, 3) with badge outlines, no useful prize detail
4. **Header area is oversized** -- Badges, title, and trophy icon use `text-xl font-bold` with `mb-6` gaps creating excessive whitespace
5. **Featured image takes too much space** -- `h-44 sm:h-64` is tall for a mobile detail view
6. **Sidebar info cards redundant on mobile** -- Duration, deadline, prizes are in separate cards that could be condensed into a compact info strip

The same issues apply when viewing webinar/in-person event details (AppCourseDetail), though that page is already in better shape from previous fixes.

## Changes

### 1. Flatten CompetitionDetail layout (`src/pages/app/CompetitionDetail.tsx`)

**Header**: Tighten spacing -- reduce `mb-6` to `mb-3`, keep title at `text-lg` instead of `text-xl`.

**Featured image**: Reduce height from `h-44` to `h-36` on mobile for a more compact feel.

**Replace 3-column grid with single-column flow**: Remove `grid gap-6 md:grid-cols-3` and `md:col-span-2`. Stack everything vertically in a single flow.

**Key Info strip**: Instead of a separate Card, render Duration, Deadline, and Participants as a compact horizontal strip (2-col grid of small info items with icons), similar to AppCourseDetail's stats grid. No card wrapper -- just `bg-muted/50 rounded-lg p-3` items.

**Description**: Replace `Card > CardHeader > CardContent` with a simple section: `h3` heading + `p` text. No card border/shadow.

**Rules**: Same flattening -- heading + text, no Card wrapper.

**Prizes**: Render inline below rules as a compact list. If prize data is just numbers, show "Prize 1", "Prize 2", etc. If prizes have names/descriptions, show those.

**My Submission**: Keep as a Card (it deserves visual distinction), but tighten padding.

### 2. Tighten EventCard in EventsTab (`src/components/learning/EventsTab.tsx`)

No changes needed -- the event list cards look good already. The detail view (AppCourseDetail) was already improved in previous iterations.

### 3. Ensure consistent compact styling for AppCourseDetail (verify)

AppCourseDetail already uses a flat layout with stats grid. No further changes needed -- it's the model we're aligning CompetitionDetail to follow.

---

## Technical Details

### File: `src/pages/app/CompetitionDetail.tsx`

**Header section (lines 131-146)**:
- Change `mb-6` to `mb-3` on the header container
- Change title from `text-xl` to `text-lg`

**Featured image (lines 149-157)**:
- Change `h-44 sm:h-64` to `h-36 sm:h-52`
- Change `mb-6` to `mb-4`

**Main content (lines 160-341)**:
- Remove the `grid gap-6 md:grid-cols-3` wrapper and both column containers (`md:col-span-2` and the sidebar `div`)
- Replace with a single `space-y-4` container holding everything in order:

1. **Key info strip** -- a `grid grid-cols-2 gap-3` with small `bg-muted/50 rounded-lg p-3` items for Duration, Deadline, Max Participants (same pattern as AppCourseDetail stats grid). Each item: icon in a small circle + label + value.

2. **Description section** -- plain `div` with `h3 text-base font-semibold mb-2` heading "About" + `p text-sm text-muted-foreground` text. No Card wrapper.

3. **Rules section** (if exists) -- same flat pattern: heading + text.

4. **Prizes section** (if exists) -- `h3` heading + compact list with numbered badges inline.

5. **My Submission** (if exists) -- keep as Card with tighter padding (`p-4` instead of default `p-6`).

**Sidebar Submit button (lines 291-340)**: Move the submit dialog trigger into the flow (above the sticky bar code), remove the sidebar wrapper entirely.

### No other files need changes
### No database changes
### No new dependencies

