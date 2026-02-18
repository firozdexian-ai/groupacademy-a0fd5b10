

# UI Size and Layout Improvements (No Color Changes)

## Overview

This plan focuses on improving banner dimensions, card sizes, spacing, bottom navigation touch targets, and overall element proportions -- while keeping the existing color palette exactly as-is.

---

## Changes

### 1. Banner Carousel - Better Mobile Size

**File: `src/components/BannerCarousel.tsx`**

Currently the compact banner is only `h-40` (160px) which is too short on mobile. The non-compact version jumps to `h-64` which is too tall.

**Fix:**
- Compact mode: change from `h-40` to `h-44` (176px) for slightly more visual impact
- Default mode: use `h-48 sm:h-56 md:h-72 lg:h-[360px]` for smoother responsive scaling
- Reduce bottom margin in compact from `mb-4` to `mb-3`
- Make dots and arrows always visible on mobile (remove `opacity-0 group-hover:opacity-100` since mobile has no hover)

### 2. Feed Header - Tighter on Mobile

**File: `src/components/feed/FeedHeader.tsx`**

Currently uses `p-6` padding which wastes vertical space on mobile.

**Fix:**
- Change padding to `p-4 md:p-8` for tighter mobile layout
- Reduce avatar from `h-14 w-14` to `h-11 w-11` on mobile
- Tighten text spacing

### 3. Bottom Navigation - Better Touch Targets

**File: `src/layouts/TalentAppShell.tsx`**

Currently the bottom nav icons are `h-6 w-6` with `text-[10px]` labels and only 5 of 6 items shown. The touch area is cramped.

**Fix:**
- Reduce icon size to `h-5 w-5` to create more breathing room between items
- Increase label size from `text-[10px]` to `text-[11px]`
- Add a subtle active indicator (small dot or pill) under the active tab label
- Increase bottom nav height from `h-16` to `h-[60px]` (slight refinement with safe area)

### 4. AI Agents - Switch to 2-Column Card Grid

**File: `src/pages/app/AIAgents.tsx`**

Currently renders as a flat list. The reference shows a cleaner 2-column card grid.

**Fix:**
- Replace the single `<Card>` wrapping all `AgentListItem`s with a `grid grid-cols-2 gap-3` layout
- Each agent becomes a standalone card with avatar centered, name, short description, credit badge, and a CTA button

**File: `src/components/ai-agents/AgentCard.tsx`**

Update the existing `AgentCard` component to match the compact card style:
- Center the avatar at the top
- Show name and one-line description
- Credit cost badge
- Full-width "Chat Now" button at the bottom
- Smaller overall card padding (`p-3`)

### 5. Feed Cards - Slightly Larger Touch Targets

**File: `src/components/feed/FeedCardRedesigned.tsx`**

**Fix:**
- Increase action button height from `h-9` to `h-10` for better tap targets
- Increase card content padding from `p-3` to `p-4`
- Title font size from `text-sm` to `text-[15px]`

### 6. Main Content Area Padding

**File: `src/layouts/TalentAppShell.tsx`**

Currently `pb-20` for bottom nav clearance. Some pages still get cut off.

**Fix:**
- Change to `pb-24` for safer clearance on all devices

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/BannerCarousel.tsx` | Better responsive heights, always-visible mobile controls |
| `src/components/feed/FeedHeader.tsx` | Tighter mobile padding and avatar size |
| `src/layouts/TalentAppShell.tsx` | Bottom nav touch targets, main content bottom padding |
| `src/pages/app/AIAgents.tsx` | Switch to 2-column card grid layout |
| `src/components/ai-agents/AgentCard.tsx` | Compact centered card style for grid |
| `src/components/feed/FeedCardRedesigned.tsx` | Larger buttons and padding |

---

## What stays the same

- All colors, gradients, and theme variables remain untouched
- No changes to `src/index.css` or `tailwind.config.ts`
- Dark mode behavior stays identical
- All existing functionality preserved

