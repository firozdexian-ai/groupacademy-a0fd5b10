# Phase A12 — Admin Card & Table Radius Polish

Buttons and typography are now calm. The remaining visual outlier in admin is the "premium" card chrome — `rounded-[32px]` and `rounded-[40px]` borders with `border-2`, `shadow-2xl`, and `backdrop-blur-xl` on every data card and table. They make admin look like a glass dashboard mockup while the talent app uses standard `rounded-xl` / `rounded-2xl` shadcn cards.

## Why this next
Cards and tables are the dominant surface in admin (every tab is a card). Standardizing the radius/border/shadow trio will finish the visual unification A10–A11 started, without touching any layout or data.

## Scope (in)
1. **Card chrome** in `src/domains/*/components/admin/**` and `src/shells/admin/**`:
   - `rounded-[40px]` → `rounded-2xl`
   - `rounded-[32px]` → `rounded-2xl`
   - `rounded-[24px]` → `rounded-xl`
   - `border-2 border-border/40` → `border border-border/60`
   - `border-4 border-destructive/20` → `border border-destructive/30`
   - `shadow-2xl` (on cards, not buttons) → `shadow-sm`
   - `backdrop-blur-xl` / `backdrop-blur-md` on cards → drop (keep on overlays/modals only)
   - `bg-card/30` / `bg-card/50` → `bg-card`
2. **Table chrome** in the same files:
   - `border-b-2` / `border-t-2` header rules → `border-b`
   - Table header `bg-muted/30` stays (legit).
3. **Platform skeleton cards** (`DashboardCardSkeleton`, `DashboardTableSkeleton`) — match the new card style.

## Scope (out)
- No layout, grid, or spacing changes.
- No icon, color, or font changes.
- No talent / gro10x / public shells.
- Inline `<Card>` from shadcn already uses the standard `rounded-xl` — don't touch those.
- Hero KPI tiles (`StatsCard`) keep their `rounded-[32px]` — already softened in A10 and they anchor overview pages.

## Approach
1. **Audit**: `rg "rounded-\[(40|32|24)px\]|shadow-2xl|backdrop-blur-(xl|md)|border-2 border-border" src/domains/*/components/admin src/shells/admin`.
2. **Automated regex sweep**, scoped to className strings only, identical to A10/A11 pattern.
3. **Hand-tune** `DashboardCardSkeleton` + `DashboardTableSkeleton`.
4. **Visual spot-check** the preview at `/dashboard?tab=jobs-overview`, `/dashboard?tab=companies`, `/dashboard?tab=ir-dashboard`.

## Estimated surface
~80–120 admin files, regex-only edits.

## Open question
Drop `backdrop-blur-*` from cards entirely, or keep on top-level page wrappers? Default: drop from cards (it costs paint perf and adds nothing on solid backgrounds), keep on `<Dialog>`/`<Sheet>` overlays.

Approve and I'll run the sweep + tune the two skeletons.
