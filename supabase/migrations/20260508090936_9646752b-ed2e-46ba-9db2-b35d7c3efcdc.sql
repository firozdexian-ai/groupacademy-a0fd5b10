
-- ============================================================
-- Phase E: Proactive Engine — schema, dedupe, event emitters
-- ============================================================

-- E1.a ai_agents.default_channel
ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS default_channel text NOT NULL DEFAULT 'in_app'
    CHECK (default_channel IN ('in_app','whatsapp','telegram','email'));

-- E1.b agent_triggers extras
ALTER TABLE public.agent_triggers
  ADD COLUMN IF NOT EXISTS channel text
    CHECK (channel IN ('in_app','whatsapp','telegram','email')),
  ADD COLUMN IF NOT EXISTS cooldown_minutes integer NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS profession_line_id uuid,
  ADD COLUMN IF NOT EXISTS goal text;

CREATE INDEX IF NOT EXISTS idx_agent_triggers_event_active
  ON public.agent_triggers (event_kind) WHERE is_active = true;

-- E1.c agent_outreach extras
ALTER TABLE public.agent_outreach
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS external_message_id text;

-- E1.d dedupe table
CREATE TABLE IF NOT EXISTS public.agent_outreach_dedupe (
  agent_id uuid NOT NULL,
  recipient_kind text NOT NULL,
  recipient_id uuid,
  event_kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_outreach_dedupe
  ON public.agent_outreach_dedupe (agent_id, recipient_kind, COALESCE(recipient_id,'00000000-0000-0000-0000-000000000000'::uuid), event_kind);
CREATE INDEX IF NOT EXISTS idx_agent_outreach_dedupe_sent_at
  ON public.agent_outreach_dedupe (sent_at);

ALTER TABLE public.agent_outreach_dedupe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read dedupe" ON public.agent_outreach_dedupe
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- E1.e dedupe RPC: returns true if NOT throttled (i.e. ok to send)
CREATE OR REPLACE FUNCTION public.try_dedupe_outreach(
  p_agent_id uuid,
  p_recipient_kind text,
  p_recipient_id uuid,
  p_event_kind text,
  p_cooldown_minutes integer DEFAULT 1440
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing timestamptz;
BEGIN
  SELECT sent_at INTO v_existing
  FROM public.agent_outreach_dedupe
  WHERE agent_id = p_agent_id
    AND recipient_kind = p_recipient_kind
    AND COALESCE(recipient_id,'00000000-0000-0000-0000-000000000000'::uuid)
        = COALESCE(p_recipient_id,'00000000-0000-0000-0000-000000000000'::uuid)
    AND event_kind = p_event_kind;

  IF v_existing IS NOT NULL AND v_existing > now() - make_interval(mins => p_cooldown_minutes) THEN
    RETURN false;
  END IF;

  INSERT INTO public.agent_outreach_dedupe (agent_id, recipient_kind, recipient_id, event_kind, sent_at)
  VALUES (p_agent_id, p_recipient_kind, p_recipient_id, p_event_kind, now())
  ON CONFLICT (agent_id, recipient_kind, COALESCE(recipient_id,'00000000-0000-0000-0000-000000000000'::uuid), event_kind)
  DO UPDATE SET sent_at = EXCLUDED.sent_at;

  RETURN true;
END;
$$;

-- ============================================================
-- E3 Event emitters
-- ============================================================

-- talent.market_ready (public_profile_enabled flips false→true)
CREATE OR REPLACE FUNCTION public.emit_talent_market_ready()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (COALESCE(OLD.public_profile_enabled,false) = false)
     AND (NEW.public_profile_enabled = true) THEN
    PERFORM public.enqueue_platform_event(
      'talent.market_ready', 'talent', NEW.id,
      jsonb_build_object('full_name', NEW.full_name, 'phone', NEW.phone)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_emit_talent_market_ready ON public.talents;
CREATE TRIGGER trg_emit_talent_market_ready
  AFTER UPDATE OF public_profile_enabled ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.emit_talent_market_ready();

-- talent.coach_assigned
CREATE OR REPLACE FUNCTION public.emit_talent_coach_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.career_coach_instructor_id IS NOT NULL
     AND (OLD.career_coach_instructor_id IS NULL
          OR OLD.career_coach_instructor_id <> NEW.career_coach_instructor_id) THEN
    PERFORM public.enqueue_platform_event(
      'talent.coach_assigned', 'talent', NEW.id,
      jsonb_build_object('coach_instructor_id', NEW.career_coach_instructor_id, 'full_name', NEW.full_name, 'phone', NEW.phone)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_emit_talent_coach_assigned ON public.talents;
CREATE TRIGGER trg_emit_talent_coach_assigned
  AFTER UPDATE OF career_coach_instructor_id ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.emit_talent_coach_assigned();

-- enrollments → course.completed
CREATE OR REPLACE FUNCTION public.emit_course_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND COALESCE(OLD.status,'') <> 'completed' THEN
    PERFORM public.enqueue_platform_event(
      'course.completed', 'talent', NEW.talent_id,
      jsonb_build_object('enrollment_id', NEW.id, 'content_id', NEW.content_id)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_emit_course_completed ON public.enrollments;
CREATE TRIGGER trg_emit_course_completed
  AFTER UPDATE OF status ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.emit_course_completed();

-- agent_pitch_log → pitch.sent
CREATE OR REPLACE FUNCTION public.emit_pitch_sent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_platform_event(
    'pitch.sent', 'company', NEW.company_id,
    jsonb_build_object(
      'pitch_id', NEW.id,
      'talent_id', NEW.talent_id,
      'phone', NEW.phone,
      'dispatched', NEW.dispatched
    )
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_emit_pitch_sent ON public.agent_pitch_log;
CREATE TRIGGER trg_emit_pitch_sent
  AFTER INSERT ON public.agent_pitch_log
  FOR EACH ROW EXECUTE FUNCTION public.emit_pitch_sent();

-- gig_matches → gig.match_high_score
CREATE OR REPLACE FUNCTION public.emit_gig_match_high()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.score >= 0.85 THEN
    PERFORM public.enqueue_platform_event(
      'gig.match_high_score', 'talent', NEW.talent_id,
      jsonb_build_object('gig_id', NEW.gig_id, 'gig_kind', NEW.gig_kind, 'score', NEW.score, 'why_text', NEW.why_text)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_emit_gig_match_high ON public.gig_matches;
CREATE TRIGGER trg_emit_gig_match_high
  AFTER INSERT ON public.gig_matches
  FOR EACH ROW EXECUTE FUNCTION public.emit_gig_match_high();

-- ============================================================
-- E2 Profile-stale sweep RPC (called by cron)
-- ============================================================
CREATE OR REPLACE FUNCTION public.sweep_stale_talent_profiles(p_days integer DEFAULT 14)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0;
BEGIN
  WITH stale AS (
    SELECT t.id, t.full_name, t.phone
    FROM public.talents t
    WHERE COALESCE(t.public_profile_enabled,false) = false
      AND t.updated_at < now() - make_interval(days => p_days)
      AND NOT EXISTS (
        SELECT 1 FROM public.platform_events pe
        WHERE pe.event_kind = 'talent.profile_stale'
          AND pe.subject_id = t.id
          AND pe.created_at > now() - interval '7 days'
      )
    LIMIT 100
  ), inserted AS (
    INSERT INTO public.platform_events (event_kind, subject_kind, subject_id, payload)
    SELECT 'talent.profile_stale', 'talent', s.id,
           jsonb_build_object('full_name', s.full_name, 'phone', s.phone, 'days_stale', p_days)
    FROM stale s
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM inserted;
  RETURN v_count;
END;
$$;

-- ============================================================
-- E6 admin observability helper view
-- ============================================================
CREATE OR REPLACE VIEW public.agent_outreach_admin_v AS
SELECT
  o.id, o.created_at, o.status, o.channel, o.recipient_kind, o.recipient_id,
  o.subject, o.body, o.credits_charged, o.error_message, o.external_message_id,
  o.conversation_id, o.event_id, o.trigger_id,
  a.agent_key, a.name AS agent_name,
  t.event_kind
FROM public.agent_outreach o
LEFT JOIN public.ai_agents a ON a.id = o.agent_id
LEFT JOIN public.agent_triggers t ON t.id = o.trigger_id
ORDER BY o.created_at DESC;

GRANT SELECT ON public.agent_outreach_admin_v TO authenticated;
