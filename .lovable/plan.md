# Phase 1 — Talent Shell, continued

Already shipped: route-level error boundary, MyAgents Earnings/Payouts gated, ReviewerCockpit tab content, Gro10x auth guard.

This chunk targets the rest of Phase 1.2 (gate the unfinished) and Phase 1.3 (resilience).

## A. Gate or hide unfinished talent surfaces

Wrap each route element (in `App.tsx`) or page body with `ComingSoonGate` when the feature is incomplete, OR remove its entry from the sidebar drawer / quick actions / command palette so testers don't reach a half-built screen.

Targets:

| Route / surface | Action | Reason |
|---|---|---|
| `/app/agent-marketplace` | `ComingSoonGate` wrapping page body | Raw supabase effect, empty data, no error/empty states |
| `/app/agents` (`AIAgents`) | Keep live only if seeded; otherwise gate | Heavy data dependency |
| `/app/abroad/applications`, `/app/abroad/ielts/*`, `/app/counsellor` | Gate or empty-state | Sub-flows depend on programs that are not seeded |
| `/app/gigs/appeals`, `/app/gigs/disputes`, `/app/reviewer` | Gate behind reviewer role (already partly gated) | Confirmed reviewer-role check works |
| `/app/projects`, `/app/projects/:id` | Gate if no escrow projects exist | Managed Projects not live for talents |
| `/app/competitions`, `/app/competitions/:id` | Gate | Empty competitions table |
| `/app/withdrawals` | Keep but add verification empty-state | Live financial flow |
| `/app/talent-mirror`, `/app/instructor/*` | Hide from talent sidebar (deep link still works) | Power-user surfaces |
| Sidebar drawer link "Switch to Company Portal" | Already conditional on `hasCompanyAccess` | OK |

## B. Resilience pass on the talent dashboard quick actions and top-level hubs

For each of these pages, confirm there is loading skeleton → error state → empty state, never a naked spinner:

- `/app/feed` (Feed)
- `/app/jobs` (JobsHub) — already strong, just verify mobile
- `/app/learning` (LearningHub) — verify empty-state when no enrollments
- `/app/gigs` (Gigs) — already gated for marketplace, verify For-You empty state
- `/app/profile` and `/app/profile/edit`

Add a missing-image fallback to avatars and OG images at the layout level.

## C. Sidebar drawer hygiene

In `TalentAppShell` drawer, audit each link. Remove or replace any that lead to a Coming-Soon screen so the drawer feels like a working surface, not a placeholder menu.

## D. Verification

After edits, walk the talent nav as an unauthenticated user → onboarded talent on mobile width (390px). Capture any remaining blank/error screens; gate or fix them.

## Technical notes

- `ComingSoonGate` is the canonical gate (`src/components/launch/ComingSoonGate.tsx`); use `featureKey` like `talent-projects`, `talent-agent-marketplace`, etc., so we can track waitlist signups per surface.
- Gating is preferred at the **route element** (in `App.tsx`) so the page module still lazy-loads but the body never runs — keeps bundles small and removes any chance of a runtime crash.
- For routes that are intentionally power-user / staff-only (Instructor, Talent Mirror), leave the route resolvable but remove the visual entry points from drawer + quick actions.

Approve and I'll execute A → B → C in that order, then summarise what's live vs gated for the talent shell.