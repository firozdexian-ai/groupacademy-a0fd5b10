

# Jobs Page Improvements

## Overview

After reviewing the Jobs Hub, All Jobs listing, Job Detail page, and supporting components, here are the areas to improve for better mobile UX, visual consistency, and usability.

---

## Improvements

### 1. Jobs Hub (`JobsHub.tsx`) - Tighten Layout and Spacing

**Current issues:**
- `space-y-8` creates too much vertical gap between sections on mobile
- Search section gradient area has generous padding that pushes content down
- Featured Jobs carousel cards at 300px width may be too wide on small screens (390px viewport)

**Fixes:**
- Reduce `space-y-8` to `space-y-5` for tighter mobile feel
- Reduce featured card width from `w-[300px]` to `w-[260px]` so users can see the next card peeking
- Reduce search section padding from `p-5` to `p-4`

### 2. Jobs Hub - Quick Access Pills Styling

**Current issue:** Pills look like standard outlined buttons, lacking visual distinction.

**Fix:** Add subtle colored backgrounds to each pill (Saved = amber tint, Applied = blue tint, Preferences = gray tint) for better visual hierarchy and quicker scanning.

### 3. All Jobs Page (`AppJobs.tsx`) - Mobile Grid Fix

**Current issue:** Jobs grid is `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. On mobile it's single column, which is fine, but the cards are tall and only ~2 fit on screen.

**Fix:** On mobile, use compact variant for the first few cards to show more content above the fold. Also reduce overall outer spacing from `py-6` to `py-4`.

### 4. Job Detail Page (`AppJobDetail.tsx`) - Mobile Action Button

**Current issue:** The Apply button is buried mid-page. On mobile, users must scroll to find it.

**Fix:** Add a sticky bottom CTA bar on mobile with the Apply/Save buttons, visible at all times. This is a common pattern in job apps (LinkedIn, Indeed).

### 5. Job Detail Page - Source Image Display

**Current issue:** The `source_image_url` field exists but isn't displayed prominently. Some jobs have a screenshot of the original posting.

**Fix:** If `source_image_url` exists, show it as a tappable image below the description card.

### 6. Job Card (`JobCard.tsx`) - Salary Display Enhancement

**Current issue:** Salary badge uses small text and is easy to miss.

**Fix:** When salary is present, make it slightly more prominent with a green-tinted background to draw attention (salary is a top-priority data point for job seekers).

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/JobsHub.tsx` | Reduce spacing to `space-y-5`, card width to 260px, tighter search padding |
| `src/pages/app/AppJobs.tsx` | Reduce `py-6` to `py-4` on mobile |
| `src/pages/app/AppJobDetail.tsx` | Add sticky bottom CTA bar on mobile with Apply + Save buttons |
| `src/components/jobs/JobCard.tsx` | Enhance salary badge styling with green tint |

---

## What stays the same

- All existing functionality (save, apply, AI insights, preferences)
- Color palette and theme
- No database changes
- Job data fetching logic unchanged

