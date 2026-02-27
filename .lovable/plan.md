

# Home Feed Redesign -- Mobile-First Compact Layout

## Changes Overview

Based on your feedback, here are the specific changes to implement:

---

## 1. Top Bar (Mobile) -- Simplify to 3 Elements

**Current**: Logo + Search icon + Desktop nav + Notifications + Profile dropdown + Credits + Hamburger menu
**New (mobile)**: Profile picture (left, opens sidebar) | Search bar (center) | Notification bell (right)

- Remove the logo from mobile top bar
- Remove the hamburger menu button (profile picture replaces it as sidebar trigger)
- Make the search bar always visible on mobile (not hidden behind an icon)
- Keep notification bell on the right
- Remove credits badge from top bar (already in sidebar)
- Desktop layout stays unchanged

**File**: `src/layouts/TalentAppShell.tsx`

---

## 2. Profile Card with Admin-Managed Background Image

**Current**: Hero banner fetches from `banners` table with `placement = 'hero'`
**New**: Same concept but enforce **1536x512 (3:1)** image dimensions. The background image continues to be managed from the admin Banner Manager via the `hero` placement.

- Update FeedHeader to use the 3:1 aspect ratio container
- Show compact profile info (photo, name, profession) over the background
- Add credits badge inside the card

**File**: `src/components/feed/FeedHeader.tsx`
**Admin file** (dimension label update): `src/components/dashboard/BannerManager.tsx` -- update the dimension hint text to show "1536x512 (3:1)" for hero banners

---

## 3. Home Feed Banner -- 3:1 Aspect Ratio

**Current**: Carousel uses `h-36` (compact) or `h-48` fixed heights
**New**: Use `aspect-[3/1]` CSS so the banner scales proportionally at 1536x512 (3:1)

- Replace fixed height classes with `aspect-[3/1]`
- Remove left/right chevron arrows on mobile (auto-rotate + dots only, per previous plan)

**File**: `src/components/BannerCarousel.tsx`

---

## 4. Feed Cards -- Compact Reactions + Share in One Row

**Current layout (PostCard.tsx)**:
- Row 1: Reaction summary (count + icons)
- Row 2: Reaction buttons (Like, Insightful, Celebrate)
- Row 3: Share button (separate row with border-top)
- Top-right: Non-functional 3-dot MoreHorizontal button

**New layout**:
- Remove the 3-dot button (top-right of author section)
- Move reaction count (e.g., "12 reactions") to the top-right where the 3-dot button was
- Merge reaction buttons + share button into ONE row (no separate border-t for share)
- Reaction buttons and Share button sit side-by-side in a single `flex` row

**Files**: `src/components/feed/PostCard.tsx`, `src/components/feed/ReactionBar.tsx`

---

## 5. Quick Actions Grid -- Updated Items

Per the previous approved plan, update the 8 items to:
- Row 1: Jobs, Abroad, Recommended Jobs, Remote Jobs
- Row 2: Career Scorecard, Mock Interview, Salary Analysis, Portfolio Builder

**File**: `src/components/feed/QuickActionsGrid.tsx`

---

## 6. Bottom Navigation -- Swap Abroad for AI Agents

Per the previous approved plan:
- Change tabs to: Home | Jobs | Learn | Gigs | AI Agents
- Replace Globe/Abroad with Bot/AI Agents icon

**File**: `src/layouts/TalentAppShell.tsx`

---

## 7. Spacing Tightening

- Reduce `py-6` to `py-2` on mobile for main content area
- Reduce `space-y-4` to `space-y-2` between feed sections on mobile

**File**: `src/pages/app/Feed.tsx`

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/layouts/TalentAppShell.tsx` | Mobile top bar: avatar as sidebar trigger + always-visible search + notification only. Bottom nav: swap Abroad for AI Agents |
| `src/components/feed/FeedHeader.tsx` | 3:1 background image, compact profile card with credits |
| `src/components/BannerCarousel.tsx` | Use `aspect-[3/1]`, hide arrows on mobile |
| `src/components/feed/PostCard.tsx` | Remove 3-dot button, move reaction count to top-right, merge reactions + share into one row |
| `src/components/feed/ReactionBar.tsx` | Accept and render share button inline, export total count for parent positioning |
| `src/components/feed/QuickActionsGrid.tsx` | Update 8 action items per wireframe |
| `src/pages/app/Feed.tsx` | Tighten spacing for mobile |
| `src/components/dashboard/BannerManager.tsx` | Update dimension hint to 1536x512 for hero banners |

