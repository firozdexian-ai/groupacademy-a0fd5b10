
# Fix Cover Letter Generation and Job Application Flow

## Problems Identified

### Problem 1: "Unauthorized" Error on Cover Letter Generation
The `enhance-cover-letter` edge function fails with "Unauthorized" because:
- The config has `verify_jwt = false` (required for Lovable Cloud's ES256 tokens)
- But the function calls `supabase.auth.getUser()` **without passing the token**
- When `verify_jwt = false`, you MUST pass the token explicitly: `getUser(token)`

### Problem 2: Apply Button Not Visible
After reviewing `AppJobDetail.tsx`, the Apply button logic (`renderActionButton()`) doesn't have any condition that hides the button based on CV or cover letter. The button should always appear unless:
- Deadline has passed (shows "Application Closed")
- User already applied (shows applied status)

The issue may be related to the page not loading correctly due to other errors, or the user seeing the job application page (`AppJobApplication.tsx`) where the submit button is visible but might be confusing with the CV upload section.

---

## Solution

### Fix 1: Update Edge Function Authentication

Modify `supabase/functions/enhance-cover-letter/index.ts` to pass the token explicitly:

```typescript
// BEFORE (broken):
const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

// AFTER (fixed):
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
```

This is the standard pattern for Lovable Cloud where `verify_jwt = false` is required.

### Fix 2: Improve Submit Button Clarity

The submit button in `AppJobApplication.tsx` is always visible (line 535-552), but:
- It's disabled only when `isUploadingCV` is true
- If user has no CV, clicking shows a toast error and scrolls to CV section

This flow is correct, but we can improve user experience by:
- Adding visual indication when CV is missing (button could show "Upload CV to Apply")
- Ensuring the CV upload section is more prominent

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/enhance-cover-letter/index.ts` | Pass token explicitly to `getUser(token)` |

---

## Technical Details

### Edge Function Fix

```typescript
// Line 19: Extract the token
const authHeader = req.headers.get("Authorization");
const token = authHeader?.replace("Bearer ", "");

// Line 32-36: Pass token to getUser
const {
  data: { user },
  error: authError,
} = await supabaseClient.auth.getUser(token);
```

### Why This Works
When Lovable Cloud has `verify_jwt = false`:
1. The gateway doesn't validate the JWT
2. The function receives the Authorization header
3. You MUST validate it yourself by calling `getUser(token)` with the token
4. Without the token parameter, `getUser()` returns null/unauthorized

---

## Summary

The main fix is a one-line change in the edge function to pass the JWT token explicitly. This will resolve the "Unauthorized" error when generating cover letters. The Apply button visibility appears to be working correctly based on the code review.
