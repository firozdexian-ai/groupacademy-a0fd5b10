# B4 — Wire `<ComingSoonGate>` to the waitlist RPC

Scope: one file edit (`src/components/launch/ComingSoonGate.tsx`). Replace the stubbed `setTimeout` submit with a real call to `join_feature_waitlist`. No new files, no schema, no nav changes.

## 1. What changes in the component

- Import `supabase` from `@/integrations/supabase/client`.
- On submit, call `supabase.rpc('join_feature_waitlist', { _feature_key, _email, _source_path, _metadata })`.
  - `_feature_key`: from prop.
  - `_email`: only send when user is **not** logged in (RPC uses `auth.uid()` when present).
  - `_source_path`: `window.location.pathname + window.location.search`.
  - `_metadata`: `{ ua: navigator.userAgent.slice(0, 500), referrer: document.referrer || null }`.
- Read current session once on mount via `supabase.auth.getSession()` to decide which UI to show:
  - **Logged in** → no email input; primary button = "Notify me" (one-click join).
  - **Logged out** → email input + "Notify me", plus a secondary `Link to "/auth?redirect=…"` row labeled "Sign up for full updates".
- Handle RPC response:
  - `{ status: 'joined' }` → success toast "You're on the list — we'll email you when it opens."
  - `{ status: 'already_joined' }` → neutral toast "You're already on the list."
  - Either way → set `joined=true` and persist `localStorage` key (already in B2).
- Error path → `toast.error(error.message || 'Could not join…')`, keep button enabled for retry.

## 2. Cross-device dedup (logged-in only)

On mount, if a session exists **and** `localStorage` flag is missing, do one cheap check:
```ts
supabase.from('feature_waitlist').select('id').eq('feature_key', featureKey).limit(1)
```
RLS allows users to read their own rows. If a row comes back → set `joined=true` and write the localStorage flag. Skip this call entirely for logged-out users (would just hit RLS and return empty).

## 3. `showWhen` predicate (unchanged from B2)

Already in B2. No change. B5 will pass it for leaderboards-style threshold gating.

## 4. Behavior unchanged

- Mobile-first layout, semantic tokens, focus management, dedup via localStorage — all preserved from B2.
- Component remains pure (no router-state changes, no global side effects beyond the RPC call + toast).

## 5. Out of scope

- B5 surface rollout (no routes wrapped in this step).
- B6 admin signals widget.
- Email confirmation to waitlist subscribers.
- Captcha/turnstile on anon submits.

## 6. Verification

- Manual: open `/app/reviewer` *after* B5 wraps it… no — that's B5. For B4 verification, temporarily mount `<ComingSoonGate featureKey="reviewer-program" />` on a throwaway test route? **No — skip.** Instead verify by:
  1. TypeScript build passes (auto by harness).
  2. `supabase--read_query` after a manual smoke (user clicks once in preview after B5 ships) confirms a row in `feature_waitlist`.
- Defer live smoke to end of B5 to avoid noise.

## 7. Risks

- RPC name typo → caught by build + first smoke test.
- `auth.getSession()` race on first render → handled by storing `sessionReady` flag; form disabled until known.
- Anon user submitting without email → already blocked client-side; RPC also blocks server-side.

---

Awaiting "go" to switch to build mode and apply the single edit.
