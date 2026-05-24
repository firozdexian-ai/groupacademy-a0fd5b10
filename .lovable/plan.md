# B3 — Waitlist table + RPC (migration only)

Scope: one migration. No frontend wiring yet (that's B4). No UI changes.

## 1. Table: `public.feature_waitlist`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `feature_key` | text NOT NULL | matches B1 registry (`gigs-marketplace`, `reviewer-program`, …, `abroad-country-*`) |
| `user_id` | uuid NULL | set when authed; FK-free per project convention |
| `email` | text NULL | required when `user_id` is NULL (anon path) |
| `source_path` | text NULL | e.g. `/app/reviewer` — for debug/analytics |
| `user_agent` | text NULL | trimmed to 500 chars |
| `metadata` | jsonb NOT NULL default `'{}'::jsonb` | future-proofing (referrer, locale, etc.) |
| `created_at` | timestamptz NOT NULL default `now()` |

Constraints / indexes:
- `CHECK (user_id IS NOT NULL OR email IS NOT NULL)` — at least one identity
- `CHECK (char_length(feature_key) BETWEEN 1 AND 80)`
- Partial unique index `(user_id, feature_key) WHERE user_id IS NOT NULL` — dedup authed
- Partial unique index `(lower(email), feature_key) WHERE email IS NOT NULL AND user_id IS NULL` — dedup anon
- Index on `(feature_key, created_at DESC)` — powers B6 admin widget

## 2. RLS

Enable RLS. Policies:

- **INSERT (anon + authed)**: `WITH CHECK (true)` — anyone may join (the RPC enforces shape; direct inserts also fine since columns are non-sensitive and dedup is enforced by unique indexes).
- **SELECT (admin only)**: `USING (public.has_role(auth.uid(), 'admin'))` — only admins read the list. Talents do not need to see who else joined.
- **SELECT (own rows, authed)**: `USING (auth.uid() = user_id)` — so a logged-in user can check their own joins (used by B4 to suppress re-prompt across devices).
- No UPDATE / DELETE policies (admin-only via service role if ever needed).

## 3. RPC: `public.join_feature_waitlist(_feature_key text, _email text default null, _source_path text default null, _metadata jsonb default '{}'::jsonb)`

- `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`
- Returns `jsonb`: `{ status: 'joined' | 'already_joined', id: uuid }`
- Logic:
  1. Validate `_feature_key` matches `^[a-z0-9][a-z0-9-]{0,79}$` (raises `invalid_argument` otherwise).
  2. Resolve identity: `_uid := auth.uid()`. If `_uid IS NULL` and `_email IS NULL` → raise `invalid_argument` ("email required").
  3. Normalize email: `lower(trim(_email))` when present; validate basic regex.
  4. `INSERT … ON CONFLICT DO NOTHING` against the appropriate unique index.
  5. If conflict (no row returned), fetch the existing row id and return `already_joined`. Else return `joined`.
- `GRANT EXECUTE … TO anon, authenticated`.

## 4. Admin helper RPC (read-only, for B6): `public.get_feature_waitlist_signals(_limit int default 50)`

- `SECURITY DEFINER`, returns table `(feature_key text, total bigint, last_24h bigint, last_7d bigint, latest_at timestamptz)`.
- Guard with `IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden' END IF;` at the top.
- Powers the admin widget in B6 without exposing PII.

## 5. Out of scope (explicit)

- No frontend changes (B4 does that).
- No email notification system to waitlist subscribers (P4 punch list, if at all).
- No moderation UI beyond the read-only signals RPC (B6 renders it).
- No retention/cleanup cron — table is small, defer.

## 6. Verification after migration runs

- `supabase--linter` — confirm no new RLS/security warnings.
- `supabase--read_query` smoke: `SELECT proname FROM pg_proc WHERE proname IN ('join_feature_waitlist','get_feature_waitlist_signals');`
- Stop. Wait for sign-off before B4 wires the gate.

## 7. Risks

- **Anon spam**: unique index on `(lower(email), feature_key)` limits dedup but not flood. Acceptable for v0.5 — revisit with captcha/turnstile if abused.
- **PII**: only email + UA stored; admin-only SELECT. No phone, no name. Aligns with PII memory.
- **Migration is additive**: no existing data touched; rollback = `DROP TABLE` if needed.

---

Awaiting "go" to switch to build mode and run the migration.
