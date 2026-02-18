

# Add Quick Actions Grid to Feed/Home Page

## Overview

Add a 4x2 icon grid below the banner on the Feed page for quick access to key app features: Jobs, Abroad, Services, Career Tracks, Assessment, Mock Interview, Salary Analysis, and Portfolio.

---

## Implementation

### 1. Create New Component: `src/components/feed/QuickActionsGrid.tsx`

A self-contained grid component with 8 items in a `grid-cols-4` layout (4 columns, 2 rows):

| Row 1 | Jobs | Abroad | Services | Tracks |
|-------|------|--------|----------|--------|
| Row 2 | Assessment | Interview | Salary | Portfolio |

Each item will have:
- A circular colored icon container (using the existing `bg-primary/10` pattern)
- A label below the icon (11-12px text)
- Tap navigates to the relevant route
- Optional badge support (e.g., "New", "Hot") for future use

Routes mapped from `src/lib/routes.ts`:
- Jobs -> `/app/jobs`
- Abroad -> `/app/abroad`
- Services -> `/app/services`
- Career Tracks -> `/app/learning/tracks`
- Assessment -> `/app/services/assessment`
- Mock Interview -> `/app/services/mock-interview`
- Salary Analysis -> `/app/services/salary-analysis`
- Portfolio -> `/app/services/portfolio`

Icons from lucide-react:
- Briefcase, Plane, Sparkles, Target, ClipboardList, Mic, DollarSign, Palette

### 2. Integrate into Feed Page: `src/pages/app/Feed.tsx`

Insert `<QuickActionsGrid />` directly after the `<BannerCarousel compact />` on line 218, before the mobile-only widgets section.

```tsx
{/* Banner */}
<BannerCarousel compact />

{/* Quick Actions Grid */}
<QuickActionsGrid />

{/* Mobile-Only Widgets */}
...
```

The grid will be visible on all screen sizes but most impactful on mobile.

---

## Technical Details

### QuickActionsGrid Component Structure
```tsx
const actions = [
  { icon: Briefcase, label: "Jobs", path: "/app/jobs" },
  { icon: Plane, label: "Abroad", path: "/app/abroad" },
  { icon: Sparkles, label: "Services", path: "/app/services" },
  { icon: Target, label: "Tracks", path: "/app/learning/tracks" },
  { icon: ClipboardList, label: "Assessment", path: "/app/services/assessment" },
  { icon: Mic, label: "Interview", path: "/app/services/mock-interview" },
  { icon: DollarSign, label: "Salary", path: "/app/services/salary-analysis" },
  { icon: Palette, label: "Portfolio", path: "/app/services/portfolio" },
];
```

Each item renders as:
- A tappable `div` with `cursor-pointer` and `active:scale-95` for feedback
- Circular icon container (`h-12 w-12 rounded-full bg-primary/10`)
- Icon inside (`h-5 w-5 text-primary`)
- Label below (`text-[11px] text-center`)

The grid uses `grid grid-cols-4 gap-3` for a compact 4x2 layout.

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/feed/QuickActionsGrid.tsx` | Create | New 4x2 icon grid component |
| `src/pages/app/Feed.tsx` | Modify | Insert QuickActionsGrid after banner |

