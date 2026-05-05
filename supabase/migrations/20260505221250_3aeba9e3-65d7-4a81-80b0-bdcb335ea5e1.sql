
-- 1. Enrollment RPC (single source of truth)
CREATE OR REPLACE FUNCTION public.enroll_in_content(
  p_content_id uuid,
  p_ref_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_talent_id uuid;
  v_student_id uuid;
  v_email text;
  v_full_name text;
  v_phone text;
  v_content RECORD;
  v_cost numeric(12,1);
  v_existing RECORD;
  v_balance numeric(12,1);
  v_new_balance numeric(12,1);
  v_enrollment_id uuid;
  v_referrer_id uuid;
  v_ref_award numeric(12,1) := 10;
  v_ref_balance numeric(12,1);
  v_ref_earned numeric(12,1);
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT id, email, full_name, phone INTO v_talent_id, v_email, v_full_name, v_phone
    FROM public.talents WHERE user_id = v_user;
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_missing');
  END IF;

  -- Ensure a students row exists so legacy code paths keep working.
  SELECT id INTO v_student_id FROM public.students WHERE user_id = v_user;
  IF v_student_id IS NULL THEN
    INSERT INTO public.students (user_id, student_id, full_name, email, phone, status)
    VALUES (
      v_user,
      'GA-' || lpad((floor(random()*99999))::int::text, 5, '0') || '-' || substr(v_user::text, 1, 4),
      COALESCE(v_full_name, v_email, 'Talent'),
      COALESCE(v_email, v_user::text || '@noreply.local'),
      v_phone,
      'free_learner'
    )
    RETURNING id INTO v_student_id;
  END IF;

  SELECT * INTO v_content FROM public.content WHERE id = p_content_id;
  IF v_content IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'course_not_found');
  END IF;
  IF NOT v_content.is_published OR COALESCE(v_content.is_private, false) OR NOT v_content.is_ready THEN
    RETURN jsonb_build_object('success', false, 'error', 'course_inactive');
  END IF;

  IF v_content.content_type IN ('live_webinar','batch_class','offline_seminar') THEN
    IF v_content.event_date IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'event_unscheduled');
    END IF;
    IF v_content.event_date < (now() - interval '2 hours') THEN
      RETURN jsonb_build_object('success', false, 'error', 'event_expired');
    END IF;
  END IF;

  IF v_content.max_capacity IS NOT NULL
     AND COALESCE(v_content.current_enrollment, 0) >= v_content.max_capacity THEN
    -- allow re-fetch of own enrollment, otherwise reject
    SELECT * INTO v_existing FROM public.enrollments
      WHERE content_id = p_content_id
        AND (talent_id = v_talent_id OR student_id = v_student_id)
      LIMIT 1;
    IF v_existing IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'sold_out');
    END IF;
  END IF;

  v_cost := COALESCE(v_content.credit_cost::numeric, ceil(COALESCE(v_content.price,0)::numeric / 0.02));
  IF v_cost < 0 THEN v_cost := 0; END IF;

  -- Existing enrollment? Idempotent return.
  SELECT * INTO v_existing FROM public.enrollments
    WHERE content_id = p_content_id
      AND (talent_id = v_talent_id OR student_id = v_student_id)
    LIMIT 1;

  IF v_existing IS NOT NULL THEN
    -- Backfill missing IDs so the player works for both code paths
    UPDATE public.enrollments
       SET talent_id = COALESCE(talent_id, v_talent_id),
           student_id = COALESCE(student_id, v_student_id),
           status = CASE WHEN status = 'pending_payment' AND v_cost = 0 THEN 'active'::enrollment_status ELSE status END
     WHERE id = v_existing.id;
    RETURN jsonb_build_object(
      'success', true,
      'already_enrolled', true,
      'enrollment_id', v_existing.id,
      'whatsapp_link', v_content.whatsapp_group_link
    );
  END IF;

  -- Charge credits if needed
  IF v_cost > 0 THEN
    SELECT balance INTO v_balance FROM public.talent_credits WHERE talent_id = v_talent_id FOR UPDATE;
    IF v_balance IS NULL THEN
      INSERT INTO public.talent_credits (talent_id, balance, earned_balance) VALUES (v_talent_id, 0, 0);
      v_balance := 0;
    END IF;
    IF v_balance < v_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits',
        'required', v_cost, 'available', v_balance);
    END IF;
    v_new_balance := v_balance - v_cost;
    UPDATE public.talent_credits SET balance = v_new_balance WHERE talent_id = v_talent_id;
    INSERT INTO public.credit_transactions
      (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
    VALUES
      (v_talent_id, -v_cost, v_new_balance, 'service_usage', 'course_enrollment',
       p_content_id, 'Enrolled: ' || v_content.title, false);
  ELSE
    SELECT balance INTO v_new_balance FROM public.talent_credits WHERE talent_id = v_talent_id;
  END IF;

  INSERT INTO public.enrollments (talent_id, student_id, content_id, status, payment_amount)
  VALUES (v_talent_id, v_student_id, p_content_id, 'active'::enrollment_status, v_cost)
  RETURNING id INTO v_enrollment_id;

  UPDATE public.content
     SET current_enrollment = COALESCE(current_enrollment, 0) + 1
   WHERE id = p_content_id;

  -- Affiliate payout (10 credits, prevent self-referral, prevent duplicate per (referrer, content, referred))
  IF p_ref_code IS NOT NULL AND length(p_ref_code) > 0 THEN
    SELECT id INTO v_referrer_id FROM public.talents
      WHERE ref_code = p_ref_code OR id::text = p_ref_code
      LIMIT 1;
    IF v_referrer_id IS NOT NULL AND v_referrer_id <> v_talent_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.credit_transactions
         WHERE talent_id = v_referrer_id
           AND service_type = 'course_affiliate'
           AND reference_id = p_content_id
           AND description LIKE '%' || v_talent_id::text || '%'
      ) THEN
        SELECT balance, earned_balance INTO v_ref_balance, v_ref_earned
          FROM public.talent_credits WHERE talent_id = v_referrer_id FOR UPDATE;
        IF v_ref_balance IS NULL THEN
          INSERT INTO public.talent_credits (talent_id, balance, earned_balance) VALUES (v_referrer_id, 0, 0);
          v_ref_balance := 0; v_ref_earned := 0;
        END IF;
        UPDATE public.talent_credits
           SET balance = v_ref_balance + v_ref_award,
               earned_balance = v_ref_earned + v_ref_award
         WHERE talent_id = v_referrer_id;
        INSERT INTO public.credit_transactions
          (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
        VALUES
          (v_referrer_id, v_ref_award, v_ref_balance + v_ref_award, 'gig_reward', 'course_affiliate',
           p_content_id,
           'Course affiliate payout: ' || v_content.title || ' (referred ' || v_talent_id::text || ')',
           true);
        INSERT INTO public.notifications (talent_id, type, title, message, icon, link)
        VALUES (v_referrer_id, 'reward', 'You earned 10 credits 🎉',
          'Someone enrolled in "' || v_content.title || '" through your link.', 'coins', '/app/withdrawals');
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_enrollment_id,
    'cost', v_cost,
    'new_balance', v_new_balance,
    'whatsapp_link', v_content.whatsapp_group_link
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.enroll_in_content(uuid, text) TO authenticated;

-- 2. Recorded course readiness sync
CREATE OR REPLACE FUNCTION public.sync_recorded_course_readiness(p_content_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer := 0;
BEGIN
  WITH usable AS (
    SELECT c.id,
      EXISTS (
        SELECT 1 FROM public.course_modules cm
        WHERE cm.content_id = c.id
          AND (
            cm.video_url IS NOT NULL
            OR EXISTS (SELECT 1 FROM public.module_resources mr WHERE mr.module_id = cm.id)
          )
      ) AS is_usable
    FROM public.content c
    WHERE c.content_type = 'recorded_course'
      AND (p_content_id IS NULL OR c.id = p_content_id)
  )
  UPDATE public.content c
     SET is_ready = u.is_usable
    FROM usable u
   WHERE c.id = u.id
     AND c.is_ready IS DISTINCT FROM u.is_usable;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_recorded_course_readiness(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_sync_readiness_from_module()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.sync_recorded_course_readiness(COALESCE(NEW.content_id, OLD.content_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_module_readiness ON public.course_modules;
CREATE TRIGGER trg_module_readiness
AFTER INSERT OR UPDATE OR DELETE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_readiness_from_module();

CREATE OR REPLACE FUNCTION public.trg_sync_readiness_from_resource()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cid uuid;
BEGIN
  SELECT content_id INTO v_cid FROM public.course_modules
   WHERE id = COALESCE(NEW.module_id, OLD.module_id);
  IF v_cid IS NOT NULL THEN
    PERFORM public.sync_recorded_course_readiness(v_cid);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_resource_readiness ON public.module_resources;
CREATE TRIGGER trg_resource_readiness
AFTER INSERT OR UPDATE OR DELETE ON public.module_resources
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_readiness_from_resource();

-- One-time cleanup
SELECT public.sync_recorded_course_readiness(NULL);

-- 3. Course affiliate clicks
CREATE TABLE IF NOT EXISTS public.course_affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  ref_code text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_aff_clicks_content ON public.course_affiliate_clicks(content_id);
CREATE INDEX IF NOT EXISTS idx_course_aff_clicks_talent ON public.course_affiliate_clicks(talent_id);
ALTER TABLE public.course_affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents see own affiliate clicks"
  ON public.course_affiliate_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talents t WHERE t.id = course_affiliate_clicks.talent_id AND t.user_id = auth.uid()));

CREATE POLICY "Admins read affiliate clicks"
  ON public.course_affiliate_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.track_course_referral_click(p_content_id uuid, p_ref_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_talent_id uuid;
BEGIN
  IF p_ref_code IS NULL OR length(p_ref_code) = 0 THEN
    RETURN jsonb_build_object('tracked', false, 'reason', 'no_ref');
  END IF;
  SELECT id INTO v_talent_id FROM public.talents
   WHERE ref_code = p_ref_code OR id::text = p_ref_code
   LIMIT 1;
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('tracked', false, 'reason', 'invalid_ref');
  END IF;
  INSERT INTO public.course_affiliate_clicks (content_id, talent_id, ref_code)
  VALUES (p_content_id, v_talent_id, p_ref_code);
  RETURN jsonb_build_object('tracked', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_course_referral_click(uuid, text) TO anon, authenticated;

-- 4. Seed Share-a-course gig
INSERT INTO public.gigs (category, title, description, credit_reward, is_active, display_order, max_completions_per_user, auto_approval_mode, auto_approval_config)
SELECT 'course_resell','Share a course with your network',
  'Pick an active course, get a unique tracking link, share it across channels. Earn 10 credits for every person who enrolls through your link.',
  10, true, 110, 500, 'link_check', jsonb_build_object('min_clicks', 1)
WHERE NOT EXISTS (SELECT 1 FROM public.gigs WHERE category = 'course_resell');

-- 5. Backfill urgent webinar credit cost so 250 welcome covers 100
UPDATE public.content
   SET credit_cost = 100
 WHERE slug = 'the-ai-powered-professional-10x-your-productivity-with-agentic-ai'
   AND (credit_cost IS NULL OR credit_cost = 0);
