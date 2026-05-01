## Problem

Sign-in for `firoz@gro10x.com` (a real company member) fails with:
> "This account is not registered to any company workspace. Maybe it is a talent account."

Network trace shows the actual cause:

```
GET /rest/v1/company_members?...&user_id=eq.866df0ba...
500 — infinite recursion detected in policy for relation "company_members"
```

Riya's pre-check (`check-company-account`, service role) correctly returns `{exists:true, isCompany:true}`, but the client-side membership verification in `Gro10xSignIn.tsx` hits broken RLS, throws, and the catch branch shows the misleading "talent account" message before signing the user out.

## Fix

### 1. Repair `company_members` RLS (root cause)

Drop the recursive policies on `company_members` and replace them with policies backed by a `SECURITY DEFINER` helper that bypasses RLS, mirroring the `has_role` pattern already used elsewhere.

New helper (in a migration):
```sql
create or replace function public.is_company_member(_user_id uuid, _company_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where user_id = _user_id and company_id = _company_id and status = 'active'
  )
$$;
```

Then rewrite the policies on `company_members`:
- `select`: `user_id = auth.uid()` OR `public.is_company_member(auth.uid(), company_id)` OR `public.has_role(auth.uid(), 'admin')`.
- `insert`/`update`/`delete`: scoped to admins of that company via `is_company_member` + an admin role check on `company_members.role`, never via a self-referential subquery in the policy itself.

This eliminates the recursion (the helper runs as definer, so it does not re-trigger RLS on `company_members`).

### 2. Harden `Gro10xSignIn.tsx`

Even with RLS fixed, the page should not lie to the user when a query fails:

- Replace the direct `from("company_members").select(...)` membership check with a call to the existing `check-company-account` edge function (service-role, RLS-immune), passing the email we just signed in with.
- Branch on the response:
  - `isCompany: true` → route to `/gro10x/inbox`.
  - `exists: true && !isCompany` → show the "talent account, switch app" message and sign out.
  - Any error → show a generic "Couldn't verify your workspace, please try again" toast and keep the session (do NOT sign out + show a wrong reason).

### 3. Verify

- Re-run sign-in for `firoz@gro10x.com` → lands on `/gro10x/inbox`.
- Sign in with a known talent-only account → still gets the correct "wrong app" message.
- Confirm the talent app's existing `useAccountType` (which also queries `company_members`) stops 500-ing on every load for company users.

## Files

- New migration: drop recursive policies on `company_members`, add `is_company_member()`, recreate policies.
- Edit `src/gro10x/pages/Gro10xSignIn.tsx`: swap direct table query for `check-company-account` invoke + better error UX.
- No edge function changes needed (`check-company-account` already does the right thing).
