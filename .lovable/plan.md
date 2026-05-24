# B5 Batch 2 — Remaining coming-soon surfaces

Batch 1 wrapped 8 full routes. Batch 2 finishes the **coming-soon** column of the defer matrix: 2 surfaces, both needing custom logic instead of a plain route wrap.

## Scope — 2 surfaces

| # | Surface | featureKey | Mechanism |
|---|---|---|---|
| 1 | `/app/gigs` **Marketplace sub-tab** | `gigs-marketplace` | Tab-level gate (not route) — `For-You` tab stays open, only the Marketplace tab content renders the gate |
| 2 | `/leaderboards/:kind` | `leaderboards-${kind}` | Route-level gate with `showWhen` threshold — auto-unlocks when `leaderboard_snapshots` rowcount ≥ 10 for that kind |

Out of scope: hide-nav / hide actions, admin signals widget, nav pruning — all B6.

## 1. Gigs Marketplace sub-tab

Find the tab switch in `src/pages/app/Gigs.tsx` (or equivalent). Locate the `TabsContent value="marketplace"` block. Replace its children with:

```tsx
<TabsContent value="marketplace">
  <ComingSoonGate
    featureKey="gigs-marketplace"
    title="Open Marketplace"
    description="Browse public gigs from verified clients. Opening once we onboard the first wave."
    secondaryCtaLabel="See For-You picks"
    secondaryCtaHref="/app/gigs"
  >
    {/* existing marketplace content */}
  </ComingSoonGate>
</TabsContent>
```

The For-You tab is untouched. Default tab stays whatever it currently is.

## 2. Leaderboards threshold gate

`src/pages/public/LeaderboardPage.tsx` (or equivalent under `/leaderboards/:kind`). Wrap top-level render with:

```tsx
const { kind } = useParams<{ kind: string }>();
const safeKind = (kind ?? "talent").toLowerCase().replace(/[^a-z0-9-]/g, "-");

return (
  <ComingSoonGate
    featureKey={`leaderboards-${safeKind}`}
    title={`${capitalize(safeKind)} Leaderboard`}
    description="Rankings open once enough entries qualify. Join the waitlist to be notified."
    secondaryCtaLabel="Browse projects"
    secondaryCtaHref="/projects"
    showWhen={async () => {
      const { count } = await supabase
        .from("leaderboard_snapshots")
        .select("id", { count: "exact", head: true })
        .eq("kind", safeKind);
      return (count ?? 0) >= 10;
    }}
  >
    <LeaderboardInner />
  </ComingSoonGate>
);
```

This requires **B2's `showWhen` contract** to accept an async predicate. Need to verify the current `ComingSoonGate` implementation supports async — if it only accepts sync, this batch adds a small extension (still purely component-level, no schema).

## Verification

- Build passes (auto).
- `/app/gigs` → For-You renders normally; switching to Marketplace tab shows gate.
- `/leaderboards/talent` → gate (zero rows currently). After seeding ≥10 snapshot rows, refresh → leaderboard renders.
- `supabase--read_query` to confirm `feature_waitlist` rows for both keys after a test submit.

## Risks

- Marketplace tab may use lazy-loaded children; gate goes inside `TabsContent` so lazy still works.
- `showWhen` async support — confirm in build phase; if missing, extend `ComingSoonGate` to accept `() => Promise<boolean>` with a small loading state. Trivial change.
- Need exact file paths for the gigs page and leaderboards page — will locate in build phase via `rg`.

## Files (estimated)

1. `src/pages/app/Gigs.tsx` (or actual marketplace tab file) — 1 edit
2. `src/pages/public/LeaderboardPage.tsx` (or actual path) — 1 edit + extract `LeaderboardInner`
3. *(maybe)* `src/components/launch/ComingSoonGate.tsx` — async `showWhen` support

Then plan updated, ready for B6 (hide-nav, admin signals widget, nav pruning).
