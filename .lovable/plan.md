

# Fix: Stale Session Redirect Loop Breaking Login

## Problem

When a user (e.g., `gro10xnow@gmail.com`) visits `/auth`, a **redirect loop** occurs:

1. Browser has a stale Supabase session in localStorage (expired refresh token)
2. `useAuth` hook's `onAuthStateChange` fires with the cached (stale) user object momentarily
3. `AuthChat` sees `user` is truthy, redirects to `/app/feed`
4. `ProtectedRoute` on `/app/feed` calls `getSession()`, refresh fails → redirects back to `/auth`
5. Loop repeats — user is stuck, cannot sign in

The console confirms: `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

## Root Cause

The `useAuth` hook does not clear stale sessions when token refresh fails. It catches the error and sets `user = null`, but by then `onAuthStateChange` has already emitted the stale user, triggering the premature redirect in `AuthChat`.

## Fix (3 changes)

### 1. `src/hooks/useAuth.ts` — Clear stale tokens on refresh failure

In the `checkSession` catch block, detect refresh token errors and call `supabase.auth.signOut()` to purge localStorage. Also handle the `TOKEN_REFRESHED` event with null session in `onAuthStateChange`:

```typescript
// In onAuthStateChange:
if (event === 'TOKEN_REFRESHED' && !session) {
  // Stale token was rejected — clear everything
  supabase.auth.signOut();
}

// In checkSession catch:
if (error.message?.includes('Refresh Token') || error.code === 'refresh_token_not_found') {
  await supabase.auth.signOut();
}
```

### 2. `src/pages/AuthChat.tsx` — Validate session before redirecting

Instead of redirecting on any truthy `user`, verify the session is actually valid first:

```typescript
useEffect(() => {
  if (!authLoading && user) {
    // Double-check session is valid before redirecting
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const returnTo = searchParams.get("returnTo");
        const safeReturn = returnTo && returnTo !== "/auth" && returnTo !== "/" 
          ? returnTo : "/app/feed";
        navigate(safeReturn, { replace: true });
      }
    });
  }
}, [user, authLoading, navigate, searchParams]);
```

### 3. `src/pages/AuthClassic.tsx` — Same session validation fix

Apply the identical session validation to the classic auth page to keep both auth routes consistent.

## Impact

- Breaks the redirect loop permanently for users with stale sessions
- No database changes needed
- No changes to the signup flow logic or role definitions
- Both `/auth` and `/auth/classic` routes are hardened

