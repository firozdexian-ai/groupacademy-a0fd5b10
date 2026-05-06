
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'withdrawn';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'hired';

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_status_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.tg_job_applications_status_stamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.application_status IS DISTINCT FROM OLD.application_status) THEN
    NEW.last_status_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_applications_status_stamp ON public.job_applications;
CREATE TRIGGER trg_job_applications_status_stamp
  BEFORE INSERT OR UPDATE OF application_status ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_job_applications_status_stamp();

CREATE OR REPLACE FUNCTION public.get_application_buckets(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_active int := 0;
  v_action int := 0;
  v_closed int := 0;
BEGIN
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = p_user_id LIMIT 1;
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('active',0,'action_needed',0,'closed',0);
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE application_status IN ('submitted','sent_to_employer','viewed','shortlisted')),
    COUNT(*) FILTER (WHERE application_status IN ('rejected','withdrawn','hired'))
  INTO v_active, v_closed
  FROM public.job_applications
  WHERE talent_id = v_talent_id;

  -- Action needed: pending AI assessment
  SELECT COUNT(*) INTO v_action
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  LEFT JOIN public.job_assessments asm ON asm.application_id = ja.id
  WHERE ja.talent_id = v_talent_id
    AND ja.application_status IN ('submitted','sent_to_employer','viewed','shortlisted')
    AND j.ai_assessment_enabled = true
    AND (asm.id IS NULL OR asm.status <> 'completed');

  RETURN jsonb_build_object('active', v_active, 'action_needed', v_action, 'closed', v_closed);
END;
$$;
