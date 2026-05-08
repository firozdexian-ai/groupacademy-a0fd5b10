
-- Phase J3+J4 (retry with system_prompt)
CREATE OR REPLACE FUNCTION public.emit_job_match_high_score()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.match_score IS NOT NULL AND NEW.match_score >= 85
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.match_score,0) < 85) THEN
    INSERT INTO public.platform_events (event_kind, subject_kind, subject_id, payload)
    VALUES ('job.match_high_score', 'talent', NEW.talent_id,
      jsonb_build_object('job_id', NEW.job_id, 'match_score', NEW.match_score, 'reason', NEW.reason));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_emit_job_match_high_score ON public.ai_job_recommendations;
CREATE TRIGGER trg_emit_job_match_high_score
AFTER INSERT OR UPDATE OF match_score ON public.ai_job_recommendations
FOR EACH ROW EXECUTE FUNCTION public.emit_job_match_high_score();

CREATE OR REPLACE FUNCTION public.emit_application_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.application_status IS DISTINCT FROM OLD.application_status THEN
    INSERT INTO public.platform_events (event_kind, subject_kind, subject_id, payload)
    VALUES ('application.status_changed', 'talent', NEW.talent_id,
      jsonb_build_object('job_id', NEW.job_id, 'application_id', NEW.id,
        'old_status', OLD.application_status, 'new_status', NEW.application_status));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_emit_application_status_changed ON public.job_applications;
CREATE TRIGGER trg_emit_application_status_changed
AFTER UPDATE OF application_status ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.emit_application_status_changed();

CREATE OR REPLACE FUNCTION public.apply_to_job(
  p_job_id uuid, p_cover_letter text DEFAULT NULL, p_cv_url text DEFAULT NULL, p_source text DEFAULT 'agent'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_talent_id uuid; v_app_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT id INTO v_talent_id FROM talents WHERE user_id = v_uid LIMIT 1;
  IF v_talent_id IS NULL THEN RAISE EXCEPTION 'talent profile required'; END IF;
  SELECT id INTO v_app_id FROM job_applications WHERE job_id = p_job_id AND talent_id = v_talent_id LIMIT 1;
  IF v_app_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'application_id', v_app_id, 'already_applied', true);
  END IF;
  INSERT INTO job_applications (job_id, talent_id, professional_id, cover_letter, cv_url, source, application_status)
  VALUES (p_job_id, v_talent_id, v_uid, p_cover_letter, p_cv_url, p_source, 'submitted'::application_status)
  RETURNING id INTO v_app_id;
  RETURN jsonb_build_object('ok', true, 'application_id', v_app_id, 'already_applied', false);
END $$;

CREATE OR REPLACE FUNCTION public.save_job(p_job_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_talent_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT id INTO v_talent_id FROM talents WHERE user_id = v_uid LIMIT 1;
  IF v_talent_id IS NULL THEN RAISE EXCEPTION 'talent profile required'; END IF;
  INSERT INTO saved_items (talent_id, item_id, item_type)
  VALUES (v_talent_id, p_job_id::text, 'job')
  ON CONFLICT (talent_id, item_id, item_type) DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'job_id', p_job_id);
END $$;

CREATE OR REPLACE FUNCTION public.track_application_status(p_application_id uuid DEFAULT NULL, p_job_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_talent_id uuid; v_row record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT id INTO v_talent_id FROM talents WHERE user_id = v_uid LIMIT 1;
  IF v_talent_id IS NULL THEN RAISE EXCEPTION 'talent profile required'; END IF;
  SELECT id, job_id, application_status, last_status_at, created_at, ai_match_score INTO v_row
    FROM job_applications
   WHERE talent_id = v_talent_id
     AND ((p_application_id IS NOT NULL AND id = p_application_id)
       OR (p_job_id IS NOT NULL AND job_id = p_job_id))
   ORDER BY created_at DESC LIMIT 1;
  IF v_row IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_application_found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'application_id', v_row.id, 'job_id', v_row.job_id,
    'status', v_row.application_status, 'last_status_at', v_row.last_status_at,
    'created_at', v_row.created_at, 'ai_match_score', v_row.ai_match_score);
END $$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_application_status(uuid,uuid) TO authenticated;

INSERT INTO public.agent_tools (tool_key, name, description, category, handler_kind, handler_ref, input_schema, default_credit_cost, is_active, audience, min_level)
VALUES
('apply_to_job','Apply to Job','Submit a job application on the talent''s behalf','jobs','rpc','apply_to_job',
 '{"type":"object","required":["p_job_id"],"properties":{"p_job_id":{"type":"string","format":"uuid"},"p_cover_letter":{"type":"string"},"p_cv_url":{"type":"string"},"p_source":{"type":"string"}}}'::jsonb,
 1.0,true,ARRAY['talent'],1),
('save_job','Save Job','Save a job to the talent''s saved items','jobs','rpc','save_job',
 '{"type":"object","required":["p_job_id"],"properties":{"p_job_id":{"type":"string","format":"uuid"}}}'::jsonb,
 0.0,true,ARRAY['talent'],1),
('track_application_status','Track Application Status','Get current status of a talent''s application','jobs','rpc','track_application_status',
 '{"type":"object","properties":{"p_application_id":{"type":"string","format":"uuid"},"p_job_id":{"type":"string","format":"uuid"}}}'::jsonb,
 0.0,true,ARRAY['talent'],1)
ON CONFLICT (tool_key) DO UPDATE SET
  description=EXCLUDED.description, handler_kind=EXCLUDED.handler_kind,
  handler_ref=EXCLUDED.handler_ref, input_schema=EXCLUDED.input_schema,
  is_active=true, updated_at=now();

INSERT INTO public.ai_agents (agent_key, name, description, system_prompt, agent_type, audience, owner_kind, default_channel, is_active)
VALUES ('gig-matchmaker','Gig Matchmaker',
  'Proactively surfaces high-fit gigs to talents and recommends bidders to clients.',
  'You are the Gig Matchmaker. When a high-fit gig is detected, reach out to the talent on WhatsApp with a concise pitch and offer to draft a bid. Be helpful, specific, and respect cooldowns.',
  'platform','talent','platform','whatsapp',true)
ON CONFLICT (agent_key) DO NOTHING;

INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
WHERE t.tool_key IN ('apply_to_job','save_job','track_application_status')
  AND (a.agent_key IN ('job-hunter','talent-onboarding') OR a.agent_key LIKE 'instructor:%')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

INSERT INTO public.agent_triggers (agent_id, event_kind, channel, cooldown_minutes, recipient_strategy, template, is_active)
SELECT a.id,'job.match_high_score','whatsapp',1440,'subject',
  'I just found a Unicorn job match for you (85%+ fit). Should I apply on your behalf?',true
FROM public.ai_agents a WHERE a.agent_key='job-hunter'
  AND NOT EXISTS (SELECT 1 FROM public.agent_triggers t WHERE t.agent_id=a.id AND t.event_kind='job.match_high_score');

INSERT INTO public.agent_triggers (agent_id, event_kind, channel, cooldown_minutes, recipient_strategy, template, is_active)
SELECT a.id,'application.status_changed','whatsapp',120,'subject',
  'Update on your job application — status just changed. Tap to see what''s next.',true
FROM public.ai_agents a WHERE a.agent_key='job-hunter'
  AND NOT EXISTS (SELECT 1 FROM public.agent_triggers t WHERE t.agent_id=a.id AND t.event_kind='application.status_changed');

INSERT INTO public.agent_triggers (agent_id, event_kind, channel, cooldown_minutes, recipient_strategy, template, is_active)
SELECT a.id,'gig.match_high_score','whatsapp',1440,'subject',
  'A new high-fit gig just landed — strong match for your profile. Want me to draft a bid?',true
FROM public.ai_agents a
WHERE a.agent_key = COALESCE((SELECT agent_key FROM public.ai_agents WHERE agent_key='gig-matchmaker' LIMIT 1),'community-engine')
  AND NOT EXISTS (SELECT 1 FROM public.agent_triggers t WHERE t.agent_id=a.id AND t.event_kind='gig.match_high_score');
