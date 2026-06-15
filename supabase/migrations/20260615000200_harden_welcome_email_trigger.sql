-- Harden public.send_welcome_email() to prevent blocking inserts on public.talents
-- 1. Correctly handle empty or whitespace-only settings.
-- 2. Catch all exceptions from Vault decryption and pg_net http_post.
-- 3. Run safely without aborting the parent transaction.

CREATE OR REPLACE FUNCTION public.send_welcome_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- 1. Resolve settings from GUC (can return '' on Supabase instead of NULL)
  v_supabase_url := NULLIF(TRIM(current_setting('app.settings.supabase_url', true)), '');
  v_service_key := NULLIF(TRIM(current_setting('app.settings.service_role_key', true)), '');
  
  -- 2. Fallback to Vault secrets
  IF v_supabase_url IS NULL THEN
    BEGIN
      SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'send_welcome_email: Failed to fetch SUPABASE_URL from vault: %', SQLERRM;
    END;
  END IF;
  
  IF v_service_key IS NULL THEN
    BEGIN
      SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'send_welcome_email: Failed to fetch SUPABASE_SERVICE_ROLE_KEY from vault: %', SQLERRM;
    END;
  END IF;

  -- 3. Double-check resolved values are non-empty
  v_supabase_url := NULLIF(TRIM(v_supabase_url), '');
  v_service_key := NULLIF(TRIM(v_service_key), '');

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE LOG 'send_welcome_email: skipping — config or vault secrets not available or empty';
    RETURN NEW;
  END IF;

  -- 4. Execute HTTP post asynchronously within exception block to prevent pool timeout or database aborts
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-transactional-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'templateName', 'welcome',
        'recipientEmail', NEW.email,
        'idempotencyKey', 'welcome-' || NEW.id::text,
        'templateData', jsonb_build_object('name', COALESCE(NEW.full_name, 'there'))
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'send_welcome_email: net.http_post failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
