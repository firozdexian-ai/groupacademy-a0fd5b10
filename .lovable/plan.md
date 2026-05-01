# Fix: Company signup lands on talent portal

## Root cause

`signup-company` succeeds and `CompanySignup.tsx` calls `navigate("/company")`. But anywhere the user later hits `/`, `/index`, or auth pages, the app unconditionally sends authenticated users to `/app/feed` (talent portal). There is no concept of "this user belongs to a company workspace" in the routing layer. So a refresh, logo click, or PWA reopen drops them into the talent app — which is what just happened.

Secondary issues observed in logs:
- Stale console error `Access Denied to Node -> /for-companies/signup` — preview was running an older bundle; route exists now and will resolve after redeploy.
- `send-transactional-email` reported `Template not found in registry { templateName: "company-welcome" }` — the template IS registered in `registry.ts`; the function was running a stale build. Needs redeploy.

## Plan

### 1. Add a single source of truth: `useAccountType()`
New hook in `src/hooks/useAccountType.ts` that, for the signed-in user, returns `'company' | 'admin' | 'talent'` based on:
- `company_members` row with `status='active'` → `company`
- `user_roles` with admin/staff role → `admin`
- otherwise → `talent`

Cache in React Query (5 min stale) so it's cheap to call from many places.

### 2. Make every "post-auth landing" honor the account type

Replace the hard-coded `/app/feed` redirects in:
- `src/pages/Index.tsx` (lines 66-77)
- `src/pages/AuthClassic.tsx` (lines 62-63)
- `src/pages/AuthChat.tsx` (lines 49-50)
- `src/hooks/useAuth.ts` (line 146 emailRedirectTo)

…with a small helper `getDefaultRouteFor(accountType)`:
- `company` → `/company`
- `admin` → `/dashboard`
- `talent` → `/app/feed`

`returnTo` query param still wins when present.

### 3. Guard `/company` and `/app`
- `/company` route: if signed in but not a company member, redirect to `/app/feed` (avoid an empty workspace screen).
- `/app/*` shell (`TalentAppShell`): if the user is a company member with no talent activity, show a one-time banner "You signed up as a company — go to your workspace" linking to `/company`. (No hard block — some users may want both surfaces.)

### 4. Sign-out cleanup
`useAuth.signOut()` already navigates to `/`. Confirm the account-type cache is invalidated so the next user doesn't inherit the previous role.

### 5. Redeploy stale functions
- `signup-company` (so the improved error reporting + email invocation is live)
- `send-transactional-email` (so it picks up the `company-welcome` registry entry)

### 6. CompanySignup polish
- After `signInWithPassword`, the page already `navigate("/company")`. Add `replace: true` so back-button doesn't return to the signup form.
- Surface the new structured error fields (`code`, `details`) in the toast for clearer failures.

## Out of scope (future)
- Workspace switcher for users who belong to multiple companies (current logic picks the first membership).
- Inviting teammates flow UI (DB trigger `link_user_to_company_invites` is already in place).

## Technical notes

```text
Login / Signup / Index visit
        │
        ▼
   useAccountType()
        │
   ┌────┴────┬─────────┐
   ▼         ▼         ▼
company    admin     talent
  │          │         │
/company  /dashboard /app/feed
```

Files touched:
- new: `src/hooks/useAccountType.ts`, `src/lib/postAuthRoute.ts`
- edited: `src/pages/Index.tsx`, `src/pages/AuthClassic.tsx`, `src/pages/AuthChat.tsx`, `src/hooks/useAuth.ts`, `src/App.tsx` (guard on `/company`), `src/pages/public/CompanySignup.tsx`
- redeployed edge functions: `signup-company`, `send-transactional-email`

Approve to proceed?
