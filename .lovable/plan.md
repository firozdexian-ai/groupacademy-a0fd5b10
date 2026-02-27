

# Optimize Job Details Page -- Compact Layout & Font Consistency

## Overview

Tighten spacing, reduce font sizes, and eliminate unnecessary whitespace throughout the Job Details page to match the compact mobile-first UI standard used across Feed, Jobs Hub, and other pages.

## Changes (single file: `src/pages/app/AppJobDetail.tsx`)

### 1. Back Button
- Reduce `mb-4` to `mb-2` below the back button
- Remove the negative margin trick (`-ml-2`), keep it inline

### 2. Header Section (logo + title + save)
- Shrink company logo from `w-16 h-16` to `w-12 h-12` (matching JobCard compact style)
- Reduce `mb-4` below header to `mb-2`
- Title: `text-xl md:text-2xl` down to `text-lg md:text-xl`
- Company name: add `text-sm` to reduce size
- Save button: change from `size="lg"` to `size="sm"` to be less dominant

### 3. Info Badges Row
- Reduce badge padding from `py-1.5 px-3` to `py-1 px-2` and text to `text-xs`
- Reduce `mb-4` to `mb-2`

### 4. AI Insights Section
- Reduce wrapper `mb-6` to `mb-3`

### 5. Action Button Area
- Reduce all `mb-6` on action buttons/divs to `mb-3`

### 6. Share Button
- Reduce `mb-4` to `mb-2`

### 7. Card Content Sections (Description, Requirements, Company, Overview)
- Reduce all card `p-6` to `p-4` for tighter internal padding
- Section headings: reduce `mb-4` to `mb-2`
- Requirements list: reduce `space-y-3` to `space-y-2`
- Company info: reduce `space-y-3` to `space-y-2` and `mb-4` to `mb-2`
- Job Overview grid: reduce `gap-y-4` to `gap-y-3`
- Description sub-label spacing: reduce `mb-1` labels consistent

### 8. Outer Container
- Change `space-y-4` to `space-y-2` on the main content wrapper so cards are closer together
- Top padding `py-4` stays, bottom padding `pb-28` stays for sticky bar clearance

### 9. Source Image Card
- Reduce header padding from `p-4` to `p-3`

### 10. Sticky Bottom Bar
- Already compact at `p-3` -- no change needed

## Result

All spacing, font sizes, and padding will match the compact `py-2` / `space-y-2` / `text-sm` standard used in Feed and Jobs Hub pages, eliminating the "poster-style" feel of oversized elements and excessive gaps.

