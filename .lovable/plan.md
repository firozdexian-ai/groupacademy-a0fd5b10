
# Fix CV Parsing Authentication Error

## Problem Identified

The CV parsing is failing with `AuthSessionMissingError: Auth session missing!` because the `parse-cv` edge function uses the **incorrect authentication pattern** for stateless Deno edge functions.

### Root Cause

**Current Code** (line 294-297 in `parse-cv/index.ts`):
```typescript
const {
  data: { user },
  error: authError,
} = await supabaseClient.auth.getUser();  // ❌ Missing token parameter
```

**Required Pattern** (as used in `parse-job-post/index.ts`):
```typescript
const token = authHeader.replace('Bearer ', '');
const {
  data: { user },
  error: authError,
} = await supabaseAuth.auth.getUser(token);  // ✅ Explicit token passed
```

In Supabase Edge Functions (Deno environment), there is no persistent session storage. The `getUser()` method without a token tries to use a session that doesn't exist, causing the error. You must explicitly extract the JWT token from the Authorization header and pass it to `getUser(token)`.

---

## Solution

### Fix the `parse-cv` Edge Function

Update the authentication section to:
1. Extract the JWT token from the Authorization header
2. Pass the token explicitly to `getUser(token)`

### Code Change

**File**: `supabase/functions/parse-cv/index.ts`

**Before** (lines 290-305):
```typescript
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

const {
  data: { user },
  error: authError,
} = await supabaseClient.auth.getUser();
```

**After**:
```typescript
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

// Extract token from header and pass to getUser() for stateless edge function auth
const token = authHeader.replace('Bearer ', '');
const {
  data: { user },
  error: authError,
} = await supabaseClient.auth.getUser(token);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/parse-cv/index.ts` | Add token extraction and pass to `getUser(token)` |

---

## Why This Fix Works

Edge functions are stateless - they have no session storage like a browser. When the client calls the edge function, it sends the JWT token in the `Authorization: Bearer xxx` header. The edge function must:

1. Read that token from the header
2. Pass it explicitly to `getUser(token)` for verification

Without passing the token explicitly, `getUser()` looks for a non-existent session and throws `AuthSessionMissingError`.

---

## Expected Outcome

After this fix:
- CV uploads will parse successfully for logged-in users
- The "Analyzing CV..." stage will complete instead of failing
- Parsed data (name, skills, experience) will populate the profile form
- The immediate auto-save implemented earlier will persist the data

---

## Additional Notes

- The `parse-job-post` function already uses the correct pattern (line 224-228)
- This is a common issue in Supabase Edge Functions and is documented in the platform memory
- No database changes are required - this is purely an edge function fix
