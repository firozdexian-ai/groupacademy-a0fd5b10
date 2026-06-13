# Blank screen after sign-up — diagnosis & fix plan

## What I found in the data

Your colleague's account exists and is healthy at the DB layer:

- **Email:** `tamzidazad1@gmail.com` (not "therategmail" — that was the verbal "at" reading)
- **User created:** 2026-06-13 04:18 UTC, email auto-confirmed via Google OAuth
- **Last sign-in:** 04:20 UTC, ~2 min after signup
- **`talents` row:** created by the `handle_new_user` trigger — `full_name="Tamzid Azad"`, country defaulted to `Bangladesh` / `+880` (Google sign-in didn't carry his Canada signup metadata), **phone = NULL**, `onboarding_step=0`, `onboarding_completed_at=NULL`
- No company membership, no admin role → routes to `/app/feed`

So the auth + trigger + routing pipeline succeeded. The blank screen happens **after** he lands on `/app/feed`.

## Most likely root causes (in priority order)

1. **`/app` layout has no route-level error boundary visible to the user.** A runtime throw in `Feed`, `useFeedRecommendations`, `useTalent`, or the mandatory `PhoneCaptureModal` (he has no phone) blanks the whole shell with no fallback UI.
2. **`PhoneCaptureModal` gating misfires for Google OAuth users.** Memory rule: phone is mandatory globally. If the modal opens with bad state (e.g., missing country default for Canada, or a render loop), it can blank the page.
3. **Country/phone defaults are wrong for non-Bangladesh Google signups.** Trigger writes `Bangladesh / +880` for any Google user with no metadata. Anything downstream that geo-validates phone for Canada could throw.
4. **A repository call inside Feed throws synchronously** before any visible UI mounts (e.g., a `.select(...).single()` returning a Supabase error for a brand-new user with empty related rows).

The `platform_events` 401 in console logs is unrelated noise (anon role can't insert telemetry) — not the cause.

## Phased plan

### Phase 1 — Stop the bleeding (guaranteed user-visible fix)
- Wrap `/app/*` shell (and `/gro10x/*` for parity) in a `RouteErrorBoundary` with a branded fallback ("Something went wrong — Reload / Go to dashboard / Sign out"). Even if a child crashes, the user sees actionable UI instead of white.
- Wrap `Feed`, `PhoneCaptureModal`, and `FeedHeader` in local error boundaries that degrade gracefully (skip the broken section, render the rest).
- Add a one-time `console.error` capture that POSTs to `platform_events` via an edge function (service role) so future crashes are recoverable from server logs, not just the user's browser.

### Phase 2 — Reproduce & pinpoint
- Impersonate `tamzidazad1@gmail.com` in the preview, open `/app/feed`, capture the exact stack from console logs.
- Audit `useFeedRecommendations`, `useTalent`, and `PhoneCaptureModal` for: `.single()` calls that throw on empty results, unguarded `null` access on `talent.country_code` / `talent.phone`, render loops when `onboarding_step=0`.

### Phase 3 — Fix the actual bug
- Patch whichever component is the source (likely the phone-capture or feed-recommendations path for a brand-new, phone-less talent).
- Make the `handle_new_user` trigger smarter: don't hard-default `country=Bangladesh / +880` when the OAuth metadata has no country — leave NULL so the onboarding modal can ask, and pre-fill from browser locale on the client.
- Backfill Tamzid's row: clear the wrong `country/country_code` so his next sign-in prompts him for the real values.

### Phase 4 — Prevent regressions
- Add a Playwright/Vitest smoke test: "new Google user with no phone lands on `/app/feed` without a runtime error."
- Add a synthetic check: every 6 h, simulate a fresh signup and assert the feed renders.

## Technical notes (for me)

- Route file to wire boundaries: `src/App.tsx` (the `/app` route tree) and `src/pages/app/Feed.tsx`.
- Trigger lives in a prior migration touching `handle_new_user`; needs a new migration to drop the `Bangladesh/+880` fallback.
- Error boundary already exists: `src/components/RouteErrorBoundary.tsx` — just needs to wrap the `/app` `<Outlet/>` (currently only `Gro10xAppShell` uses it).
- Telemetry pipe: add a tiny `log-client-error` edge function bypassing the anon RLS block on `platform_events`.

## What I need from you to start Phase 2

Either:
- **(a)** Permission to impersonate his account in the preview to reproduce the crash, or
- **(b)** Ask him to reload the blank screen with the browser console open and paste the first red error.

Phase 1 (the boundary + telemetry safety net) I can ship right away regardless — that alone means no future user ever sees a true white screen again.
