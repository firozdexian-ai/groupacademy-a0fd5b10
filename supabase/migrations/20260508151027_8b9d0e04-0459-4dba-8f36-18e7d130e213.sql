
-- ========================================
-- PHASE L1: Progress rollup triggers
-- ========================================

-- Recompute enrollment_stage_progress row for a (enrollment_id, module_id)
CREATE OR REPLACE FUNCTION public.recompute_module_rollup(p_enrollment_id uuid, p_module_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_stages int;
  v_completed int;
  v_pct int;
  v_completed_stages int[];
BEGIN
  -- count total stages from course_modules.module_stages (jsonb array)
  SELECT COALESCE(jsonb_array_length(module_stages), 0)
    INTO v_total_stages
  FROM public.course_modules
  WHERE id = p_module_id;

  SELECT completed_stages INTO v_completed_stages
  FROM public.module_progress
  WHERE enrollment_id = p_enrollment_id AND module_id = p_module_id;

  v_completed := COALESCE(array_length(v_completed_stages, 1), 0);
  v_pct := CASE WHEN COALESCE(v_total_stages,0) > 0 THEN LEAST(100, (v_completed * 100) / v_total_stages) ELSE 0 END;

  INSERT INTO public.enrollment_stage_progress (
    enrollment_id, module_id, stages_completed, total_stages, progress_pct,
    started_at, completed_at
  ) VALUES (
    p_enrollment_id, p_module_id, COALESCE(v_completed_stages, ARRAY[]::int[]),
    COALESCE(v_total_stages,0), v_pct,
    now(),
    CASE WHEN v_pct >= 100 THEN now() ELSE NULL END
  )
  ON CONFLICT (enrollment_id, module_id) DO UPDATE
  SET stages_completed = EXCLUDED.stages_completed,
      total_stages = EXCLUDED.total_stages,
      progress_pct = EXCLUDED.progress_pct,
      completed_at = CASE WHEN EXCLUDED.progress_pct >= 100 AND public.enrollment_stage_progress.completed_at IS NULL THEN now() ELSE public.enrollment_stage_progress.completed_at END,
      updated_at = now();
END;
$$;

-- Add unique constraint if missing for ON CONFLICT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='enrollment_stage_progress_unique') THEN
    ALTER TABLE public.enrollment_stage_progress
      ADD CONSTRAINT enrollment_stage_progress_unique UNIQUE (enrollment_id, module_id);
  END IF;
END $$;

-- Recompute enrollments.progress from all enrollment_stage_progress rows
CREATE OR REPLACE FUNCTION public.recompute_enrollment_progress(p_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_id uuid;
  v_module_count int;
  v_avg numeric;
  v_progress int;
BEGIN
  SELECT content_id INTO v_content_id FROM public.enrollments WHERE id = p_enrollment_id;
  IF v_content_id IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_module_count FROM public.course_modules WHERE content_id = v_content_id;
  IF v_module_count = 0 THEN
    UPDATE public.enrollments SET progress = 0, updated_at = now() WHERE id = p_enrollment_id;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(progress_pct), 0)::numeric / v_module_count
    INTO v_avg
  FROM public.enrollment_stage_progress
  WHERE enrollment_id = p_enrollment_id;

  v_progress := LEAST(100, GREATEST(0, ROUND(v_avg)::int));

  UPDATE public.enrollments
  SET progress = v_progress,
      last_accessed_at = now(),
      completed_at = CASE WHEN v_progress >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END,
      status = CASE WHEN v_progress >= 100 THEN 'completed'::content_status ELSE status END,
      updated_at = now()
  WHERE id = p_enrollment_id;
END;
$$;

-- Trigger on module_progress: roll up to enrollment_stage_progress + enrollments
CREATE OR REPLACE FUNCTION public.tg_module_progress_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_module_rollup(NEW.enrollment_id, NEW.module_id);
  PERFORM public.recompute_enrollment_progress(NEW.enrollment_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_module_progress_rollup ON public.module_progress;
CREATE TRIGGER trg_module_progress_rollup
AFTER INSERT OR UPDATE ON public.module_progress
FOR EACH ROW EXECUTE FUNCTION public.tg_module_progress_rollup();

-- Trigger on enrollment_stage_progress (for direct writes): roll up to enrollments
CREATE OR REPLACE FUNCTION public.tg_stage_progress_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_enrollment_progress(NEW.enrollment_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stage_progress_rollup ON public.enrollment_stage_progress;
CREATE TRIGGER trg_stage_progress_rollup
AFTER INSERT OR UPDATE ON public.enrollment_stage_progress
FOR EACH ROW EXECUTE FUNCTION public.tg_stage_progress_rollup();

-- ========================================
-- PHASE L1: get_learning_hub_dashboard RPC
-- ========================================
CREATE OR REPLACE FUNCTION public.get_learning_hub_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_talent uuid;
  v_active jsonb;
  v_completed_count int;
  v_due_reviews int;
  v_recent_certs jsonb;
  v_upcoming_sessions jsonb;
  v_stats jsonb;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  SELECT id INTO v_talent FROM public.talents WHERE user_id = v_user LIMIT 1;
  IF v_talent IS NULL THEN
    RETURN jsonb_build_object('authenticated', true, 'talent_id', null);
  END IF;

  -- Active enrollments with course info (top 6)
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_active
  FROM (
    SELECT e.id, e.content_id, e.progress, e.last_accessed_at, e.current_module_id, e.status,
           c.title, c.slug, c.cover_image_url, c.thumbnail_url, c.content_type
    FROM public.enrollments e
    JOIN public.content c ON c.id = e.content_id
    WHERE e.talent_id = v_talent
      AND COALESCE(e.progress, 0) < 100
      AND COALESCE(e.status::text, 'active') <> 'cancelled'
    ORDER BY e.last_accessed_at DESC NULLS LAST
    LIMIT 6
  ) t;

  SELECT COUNT(*) INTO v_completed_count
  FROM public.enrollments
  WHERE talent_id = v_talent AND COALESCE(progress, 0) >= 100;

  -- Due reviews (best-effort; falls back to 0 if review table missing)
  BEGIN
    SELECT COUNT(*) INTO v_due_reviews
    FROM public.talent_skill_profile
    WHERE talent_id = v_talent AND next_review_at IS NOT NULL AND next_review_at <= now();
  EXCEPTION WHEN OTHERS THEN v_due_reviews := 0;
  END;

  -- Upcoming live sessions for this talent (next 30 days)
  BEGIN
    SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_upcoming_sessions
    FROM (
      SELECT cs.id, cs.title, cs.starts_at, cs.meeting_url, cs.cohort_id
      FROM public.course_sessions cs
      JOIN public.cohort_enrollments ce ON ce.cohort_id = cs.cohort_id
      WHERE ce.talent_id = v_talent
        AND cs.starts_at >= now()
        AND cs.starts_at <= now() + interval '30 days'
      ORDER BY cs.starts_at
      LIMIT 5
    ) s;
  EXCEPTION WHEN OTHERS THEN v_upcoming_sessions := '[]'::jsonb;
  END;

  -- Recent certificates
  BEGIN
    SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb) INTO v_recent_certs
    FROM (
      SELECT id, code, kind, issued_at, content_id
      FROM public.certificates
      WHERE talent_id = v_talent
      ORDER BY issued_at DESC NULLS LAST
      LIMIT 3
    ) c;
  EXCEPTION WHEN OTHERS THEN v_recent_certs := '[]'::jsonb;
  END;

  v_stats := jsonb_build_object(
    'active_count', COALESCE(jsonb_array_length(v_active), 0),
    'completed_count', v_completed_count,
    'due_reviews', v_due_reviews
  );

  RETURN jsonb_build_object(
    'authenticated', true,
    'talent_id', v_talent,
    'active_enrollments', v_active,
    'upcoming_sessions', v_upcoming_sessions,
    'recent_certificates', v_recent_certs,
    'stats', v_stats,
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_learning_hub_dashboard() TO authenticated;

-- ========================================
-- PHASE L2: course.started / course.completed emitters
-- ========================================
CREATE OR REPLACE FUNCTION public.tg_emit_course_started()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Idempotent: only emit if no prior course.started for this enrollment
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_events
    WHERE event_kind = 'course.started'
      AND subject_kind = 'enrollment'
      AND subject_id = NEW.id
  ) THEN
    PERFORM public.enqueue_platform_event(
      'course.started',
      'enrollment',
      NEW.id,
      jsonb_build_object(
        'talent_id', NEW.talent_id,
        'content_id', NEW.content_id,
        'enrolled_at', NEW.enrolled_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_course_started ON public.enrollments;
CREATE TRIGGER trg_emit_course_started
AFTER INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.tg_emit_course_started();

CREATE OR REPLACE FUNCTION public.tg_emit_course_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.progress,0) >= 100 AND COALESCE(OLD.progress,0) < 100 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.platform_events
      WHERE event_kind = 'course.completed'
        AND subject_kind = 'enrollment'
        AND subject_id = NEW.id
    ) THEN
      PERFORM public.enqueue_platform_event(
        'course.completed',
        'enrollment',
        NEW.id,
        jsonb_build_object(
          'talent_id', NEW.talent_id,
          'content_id', NEW.content_id,
          'completed_at', COALESCE(NEW.completed_at, now())
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_course_completed ON public.enrollments;
CREATE TRIGGER trg_emit_course_completed
AFTER UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.tg_emit_course_completed();

-- ========================================
-- PHASE L2: course.stalled sweep RPC + daily cron
-- ========================================
CREATE OR REPLACE FUNCTION public.sweep_stalled_courses()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT e.id, e.talent_id, e.content_id, e.last_accessed_at, e.progress
    FROM public.enrollments e
    WHERE COALESCE(e.progress,0) < 100
      AND e.last_accessed_at IS NOT NULL
      AND e.last_accessed_at < now() - interval '7 days'
      AND COALESCE(e.status::text,'active') <> 'cancelled'
      AND NOT EXISTS (
        SELECT 1 FROM public.platform_events pe
        WHERE pe.event_kind = 'course.stalled'
          AND pe.subject_kind = 'enrollment'
          AND pe.subject_id = e.id
          AND pe.created_at > now() - interval '7 days'
      )
  LOOP
    PERFORM public.enqueue_platform_event(
      'course.stalled',
      'enrollment',
      r.id,
      jsonb_build_object(
        'talent_id', r.talent_id,
        'content_id', r.content_id,
        'progress', r.progress,
        'last_accessed_at', r.last_accessed_at,
        'days_idle', EXTRACT(DAY FROM now() - r.last_accessed_at)::int
      )
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sweep_stalled_courses() TO service_role;

-- Daily cron at 09:00 UTC
SELECT cron.unschedule('learn-sweep-stalled-courses')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='learn-sweep-stalled-courses');

SELECT cron.schedule(
  'learn-sweep-stalled-courses',
  '0 9 * * *',
  $$ SELECT public.sweep_stalled_courses(); $$
);

-- ========================================
-- PHASE L3: Seed agent_triggers
-- ========================================
-- course.stalled → instructor:* (subject_instructor strategy when available, else 'subject')
-- We seed a generic row routed to the Community Engine as fallback owner; runtime resolves bound instructor.
INSERT INTO public.agent_triggers (
  agent_id, event_kind, recipient_strategy, channel, cooldown_minutes, template, is_active
)
SELECT
  '65387d4c-1e5a-4402-b5a3-8b6b4c766299'::uuid,
  'course.stalled',
  'subject',
  'whatsapp',
  72 * 60,
  'Hey, noticed you paused your course. Are you stuck? I am here to help you get unstuck.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_triggers WHERE event_kind = 'course.stalled'
);

-- Ensure course.completed exists with correct template (already seeded → update template if generic)
UPDATE public.agent_triggers
SET template = 'Congratulations on finishing the course! Let''s update your verified skills.',
    channel = 'in_app',
    cooldown_minutes = 1440,
    is_active = true
WHERE event_kind = 'course.completed'
  AND agent_id = '65387d4c-1e5a-4402-b5a3-8b6b4c766299'::uuid;
