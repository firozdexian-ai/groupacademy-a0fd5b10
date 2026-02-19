

# Profile and Profile Edit - Mobile UX Improvements

## Overview

Both pages are already in good shape with smart patterns (sticky save bar, unsaved changes warning, CV auto-parse). The improvements focus on tightening spacing for mobile density consistency and reducing a few oversized elements.

---

## Improvements

### 1. Profile Page (`Profile.tsx`) - Tighten Spacing

**Current issues:**
- `py-6` and `mb-6` on the hero header create generous top/bottom gaps
- The hero gradient area uses `p-6 pb-8` -- slightly generous on mobile
- `space-y-4` on profile sections (About, Experience, Education, Skills) is fine, but the `CardHeader` in each section has default padding that adds up across 4+ cards
- Sign Out button has `mt-8` creating a large gap at the bottom
- Experience/Education icon containers use `p-2.5` -- slightly large

**Fixes:**
- Reduce `py-6` to `py-4` and hero `mb-6` to `mb-5`
- Reduce hero gradient padding from `p-6 pb-8` to `p-5 pb-7`
- Reduce Experience/Education icon containers from `p-2.5` to `p-2`
- Reduce Sign Out `mt-8` to `mt-6`

### 2. Profile Edit (`ProfileEdit.tsx`) - Compact Form Sections

**Current issues:**
- `space-y-8` between form cards (Photo, CV, Basic Info, Skills, Experience, Education, Links) creates very large vertical gaps -- 7 cards x 32px = 224px of wasted spacing
- Header `mb-6` is generous
- CV upload empty state uses `p-6` padding and `h-8` icons -- slightly large on mobile
- `pb-44` at the top is very generous (only needs ~120px for the sticky bar + bottom nav)

**Fixes:**
- Reduce form `space-y-8` to `space-y-5` for tighter card grouping
- Reduce header `mb-6` to `mb-4`
- Reduce CV upload empty state padding from `p-6` to `p-5` and icon from `h-8` to `h-7`
- Reduce `pb-44` to `pb-36` (still sufficient clearance for sticky bar + bottom nav)

### 3. Profile Completion Meter (`ProfileCompletionMeter.tsx`) - Minor Polish

**Current issues:**
- The "full" variant's checklist items have `mb-4` below the list and `mb-4` above, creating 32px of internal spacing before the CTA button
- The progress ring in the full variant is `w-16 h-16` which is slightly large

**Fixes:**
- Reduce checklist `mb-4` to `mb-3` for tighter grouping
- Reduce header gap `mb-4` to `mb-3`
- Keep the ring size as-is (it serves as a visual anchor and is already well-proportioned)

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/Profile.tsx` | Reduce `py-6` to `py-4`, hero `mb-6` to `mb-5`, gradient `p-6 pb-8` to `p-5 pb-7`, icon containers `p-2.5` to `p-2`, sign out `mt-8` to `mt-6` |
| `src/pages/app/ProfileEdit.tsx` | Reduce `space-y-8` to `space-y-5`, header `mb-6` to `mb-4`, CV upload `p-6` to `p-5`, `pb-44` to `pb-36` |
| `src/components/profile/ProfileCompletionMeter.tsx` | Reduce internal `mb-4` to `mb-3` in full variant |

---

## What stays the same

- All existing functionality (CV upload/parse, photo upload, experience enhance, save/cancel, dirty state warning)
- Sticky save bar position at `bottom-[68px]`
- Color palette and theme
- No database changes

