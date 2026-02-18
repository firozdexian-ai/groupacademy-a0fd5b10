

# Remaining Sub-Pages Mobile UX Improvements

## Overview

Bringing Notifications, Saved Items, My Applications, Blog, Blog Post, Competitions, and Competition Detail pages into alignment with the tighter mobile layout standard.

---

## Improvements

### 1. Notifications (`Notifications.tsx`) - Minor Tweaks

**Current issues:**
- `py-6` and `mb-6` slightly generous
- Empty state `py-10` is tall on mobile

**Fixes:**
- Reduce `py-6` to `py-4` and `mb-6` to `mb-4`
- Reduce empty state `py-10` to `py-8`

### 2. Saved Items (`SavedItems.tsx`) - Already Good

This page is already well-optimized (compact cards, horizontal scroll tabs, `py-6 space-y-5`). Only minor fix:
- Reduce `py-6` to `py-4` for consistency
- Reduce empty state `py-12` to `py-8` and icon container from `w-16 h-16` to `w-12 h-12`

### 3. My Applications (`MyApplications.tsx`) - Tighten Layout

**Current issues:**
- `py-6` and `mb-6` generous
- Title is `text-2xl` (should be `text-xl` for mobile consistency)
- `space-y-6` on Tabs creates large gaps
- Empty state `py-16` is very tall on mobile with `w-16 h-16` icon and `text-lg` title
- Application card `CardContent` uses `p-5 pb-3` and `mb-4` gaps -- slightly generous

**Fixes:**
- Reduce `py-6` to `py-4` and `mb-6` to `mb-4`
- Reduce title to `text-xl`
- Reduce Tabs `space-y-6` to `space-y-4`
- Compact empty state: `py-10`, `w-12 h-12` icon, `text-base` title
- Reduce card `p-5` to `p-4`, `mb-4` to `mb-3`

### 4. Blog Listing (`Blog.tsx`) - Mobile Spacing & Category Scroll

**Current issues:**
- Title is `text-2xl` (should be `text-xl`)
- `mb-8` after search/filter and `space-y-8` between sections are very generous
- Category buttons use `flex-wrap` which creates 2-3 rows on mobile, pushing content below fold
- Regular posts grid `gap-6` is generous on mobile

**Fixes:**
- Reduce title to `text-xl` and `mb-6` to `mb-4`
- Reduce `mb-8` to `mb-5` and `space-y-8` to `space-y-5`
- Convert category buttons to horizontal scroll (`overflow-x-auto flex-nowrap`) for single-row on mobile
- Reduce grid `gap-6` to `gap-4` on mobile

### 5. Blog Post (`BlogPost.tsx`) - Compact Mobile Reading

**Current issues:**
- Title is `text-3xl` (very large on mobile)
- Featured image `mb-8` and excerpt `mb-6` create generous gaps
- CTA card at bottom uses `p-6` padding

**Fixes:**
- Reduce title to `text-2xl` on mobile
- Reduce featured image `mb-8` to `mb-6` and excerpt `mb-6` to `mb-4`
- Reduce CTA padding from `p-6` to `p-4`

### 6. Competitions Listing (`Competitions.tsx`) - Tighter Cards

**Current issues:**
- Title is `text-2xl` (should be `text-xl`)
- `mb-6` after tabs and `gap-6` in grid are generous
- Cards have `CardHeader` + `CardContent` with generous padding creating tall cards on mobile
- The "View Details" button in footer wastes space -- the entire card is clickable

**Fixes:**
- Reduce title to `text-xl` and `mb-6` to `mb-4`
- Reduce grid `gap-6` to `gap-4`
- Remove the "View Details" ghost button (card is already clickable)
- Reduce card image height from `h-40` to `h-32` on mobile

### 7. Competition Detail (`CompetitionDetail.tsx`) - Mobile-First Layout

**Current issues:**
- The 3-column grid (`md:grid-cols-3`) stacks on mobile, but sidebar comes after the main content requiring a long scroll to reach the "Submit Entry" CTA
- Featured image `h-64` is tall on mobile

**Fixes:**
- Add a sticky bottom CTA bar on mobile for "Submit Entry" (same pattern as Job Detail and Study Abroad Detail)
- Add `pb-28` to main container for clearance
- Reduce featured image from `h-64` to `h-44` on mobile

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/Notifications.tsx` | Reduce `py-6` to `py-4`, `mb-6` to `mb-4`, empty state `py-10` to `py-8` |
| `src/pages/app/SavedItems.tsx` | Reduce `py-6` to `py-4`, compact empty state |
| `src/pages/app/MyApplications.tsx` | Reduce spacing, title to `text-xl`, compact cards and empty state |
| `src/pages/app/Blog.tsx` | Title to `text-xl`, horizontal scroll categories, reduce gaps |
| `src/pages/app/BlogPost.tsx` | Title to `text-2xl`, reduce spacing, compact CTA |
| `src/pages/app/Competitions.tsx` | Title to `text-xl`, remove "View Details" button, reduce gaps |
| `src/pages/app/CompetitionDetail.tsx` | Sticky bottom CTA on mobile, `pb-28`, compact image |

---

## What stays the same

- All existing functionality (notifications, saved items, applications, submissions)
- Color palette and theme
- No database changes
- Data fetching and navigation logic unchanged

