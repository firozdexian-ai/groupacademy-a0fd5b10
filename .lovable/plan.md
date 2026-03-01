

# All Courses Tab -- Alignment & Detail View Cleanup

## Problems

1. **Icon strip not aligned** -- CoursesTab uses `flex gap-4` which left-clusters the icons instead of distributing them evenly. EventsTab already uses `grid grid-cols-4` which looks correct.
2. **Course detail view is bloated** -- AppCourseDetail has oversized elements compared to the compact CompetitionDetail we just redesigned:
   - Title is `text-2xl md:text-3xl` (too large for inline view)
   - `mb-8` gaps between sections create excessive whitespace
   - Description wrapped in a full `Card > CardHeader > CardContent` (should be flat)
   - Stats grid uses `mb-8` spacing
   - Instructor line has unnecessary avatar circle

## Changes

### 1. Fix icon alignment in CoursesTab (`src/components/learning/CoursesTab.tsx`)

- Change `flex gap-4` (line 81) to `grid grid-cols-4 gap-2` to match EventsTab's even distribution

### 2. Flatten AppCourseDetail layout (`src/pages/app/AppCourseDetail.tsx`)

Apply the same compact treatment we did for CompetitionDetail:

- **Media section**: Reduce `mb-6` to `mb-4` on the video/cover container
- **Header**: Reduce `mb-8` to `mb-3`, title from `text-2xl md:text-3xl` to `text-lg font-bold`, remove the instructor avatar circle (just show name as text)
- **Stats grid**: Reduce `mb-8` to `mb-4`, tighten to `gap-3`
- **Description**: Remove `Card > CardHeader > CardContent` wrapper, replace with flat section: `h3 text-base font-semibold mb-2` heading "Course Overview" + `p text-sm text-muted-foreground` text
- **Desktop CTA**: Reduce `mb-8` to `mb-4`

## Technical Details

### File: `src/components/learning/CoursesTab.tsx`

Line 81: Change `<div className="flex gap-4">` to `<div className="grid grid-cols-4 gap-2">`

### File: `src/pages/app/AppCourseDetail.tsx`

**Media (line 302)**: `mb-6` to `mb-4`

**Header (lines 323-349)**:
- `mb-8` to `mb-3`
- Title: `text-2xl md:text-3xl font-bold mb-2` to `text-lg font-bold mb-1`
- Instructor: Remove the avatar circle div, keep as simple `text-sm text-muted-foreground`

**Stats grid (line 352)**: `gap-4 mb-8` to `gap-3 mb-4`

**Desktop CTA (line 389)**: `mb-8` to `mb-4`

**Description (lines 422-431)**: Replace Card/CardHeader/CardContent with:
```
<div>
  <h3 className="text-base font-semibold mb-2">Course Overview</h3>
  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
    {course.description}
  </p>
</div>
```

### No database changes
### No new dependencies

