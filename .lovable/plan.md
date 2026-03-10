

# Batch CV Upload Bug Fix

## Root Cause (Confirmed from Error Logs)

Every batch upload attempt shows the same error for all CVs with extractable emails:

> `null value in column "url" of relation "http_request_queue" violates not-null constraint`

The CV parsing works fine — emails are extracted successfully. The failure happens when the `talents` INSERT triggers `send_welcome_email()`, which calls `net.http_post()`. The function tries to resolve `SUPABASE_URL` from `current_setting()` and then from `vault.decrypted_secrets`, but neither returns a value in this context. So `v_supabase_url` is NULL, making the URL `NULL || '/functions/v1/send-transactional-email'` = NULL, which violates the NOT NULL constraint on `http_request_queue.url`. This rolls back the entire INSERT — zero talents created.

Secondary issues: 2 of 10 CVs had "No email found" — legitimate parse failures, not bugs.

## Fixes

### 1. Database Migration — Guard `send_welcome_email()` against NULL URL

Replace the function body to add an early return if `v_supabase_url` or `v_service_key` is NULL:

```sql
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  IF v_supabase_url IS NULL THEN
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  END IF;
  IF v_service_key IS NULL THEN
    SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  END IF;

  -- GUARD: If config is unavailable, skip email silently instead of crashing the insert
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE LOG 'send_welcome_email: skipping — SUPABASE_URL or SERVICE_ROLE_KEY not available in vault';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'type', 'welcome',
      'talent_id', NEW.id::text
    )
  );

  RETURN NEW;
END;
$$;
```

This is the critical fix. Without it, no new talent can ever be inserted via batch upload.

### 2. Edge Function — Fix auth method in `batch-parse-cvs`

Replace `getClaims(token)` with `getUser(token)` to match the working `parse-cv` pattern. While `getClaims` may work in some SDK versions, `getUser` is the standard and proven method.

### 3. Build Errors — Fix `NodeJS` namespace errors

Add `/// <reference types="node" />` or replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` in the 4 affected files.

## Files to Change

| File | Change |
|------|--------|
| DB migration | Guard `send_welcome_email()` against NULL config |
| `supabase/functions/batch-parse-cvs/index.ts` | `getClaims` → `getUser` |
| `src/hooks/useAgentChat.ts` | Fix `NodeJS.Timeout` type |
| `src/hooks/useSupabaseQuery.ts` | Fix `NodeJS.Timeout` type |
| `src/pages/app/JobAssessment.tsx` | Fix `NodeJS.Timeout` type |
| `src/pages/app/JobAssessmentResults.tsx` | Fix `NodeJS.Timeout` type |

