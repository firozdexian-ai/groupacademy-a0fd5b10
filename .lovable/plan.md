

# Jobs Hub -- Compact & Font Optimization

## Problem
The Jobs Hub page has oversized fonts, excessive whitespace (especially above the tab navigation), and does not match the compact, controlled styling of the Feed/Home page.

## Changes (single file: `src/pages/app/JobsHub.tsx`)

### 1. Reduce Container Spacing
- Change outer wrapper from `py-4 space-y-5` to `py-2 space-y-2` (matching Feed's `py-2` and `space-y-2` pattern)
- This eliminates the large blank space above the tab icons

### 2. Compact Tab Navigation
- Reduce tab `py-3` to `py-2`
- Keep icon at `h-5 w-5` but tighten vertical gap from `gap-1` to `gap-0.5`

### 3. Standardize Font Sizes Across All Sections
- Section headers already use `text-base` via SectionHeader -- these are fine
- Reduce `SectionHeader` bottom margin from `mb-3 sm:mb-4` to `mb-2` by passing className
- Empty state headings: reduce from `text-lg` to `text-sm font-semibold`
- Empty state descriptions: keep at `text-sm` / `text-xs`
- Error state heading: reduce from `text-lg` to `text-base`
- AI loading heading: reduce from `text-base` to `text-sm`
- Skeleton card gaps: tighten from `gap-4` to `gap-3`

### 4. Tighten Section Gaps
- Featured Jobs carousel gap: `gap-4 pb-4` to `gap-3 pb-3`
- Promoted carousel gap: same treatment
- Card paddings in Company grid: `p-4` to `p-3`
- Company Avatar: `h-14 w-14` to `h-11 w-11`
- Collection grid card padding: `p-4` to `p-3`, icon container `h-10 w-10` to `h-8 w-8`
- AI Recommendations button height: `h-11` to `h-9`

### 5. Reduce Card Width for Carousels
- Featured/Promoted job cards: `w-[260px]` to `w-[240px]` for tighter horizontal scroll

## Result
The page will feel as compact and controlled as the Feed page, with no poster-sized fonts or wasted whitespace.

