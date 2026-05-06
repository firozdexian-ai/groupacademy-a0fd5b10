
-- 5.2 CLEANUP: gig_bid_events
CREATE TABLE IF NOT EXISTS public.gig_bid_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid NOT NULL REFERENCES public.marketplace_bids(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event = ANY (ARRAY['coach_opened','coach_accepted','coach_rejected','submitted','viewed_by_poster','shortlisted','won','lost','withdrawn'])),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gig_bid_events_bid ON public.gig_bid_events(bid_id, created_at DESC);
ALTER TABLE public.gig_bid_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bid events" ON public.gig_bid_events
  FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));
CREATE POLICY "Talent views own bid events" ON public.gig_bid_events
  FOR SELECT TO authenticated
  USING (bid_id IN (
    SELECT id FROM public.marketplace_bids WHERE talent_id IN (
      SELECT id FROM public.talents WHERE user_id = auth.uid()
    )
  ));

-- 5.2 CLEANUP: unified submissions view
CREATE OR REPLACE VIEW public.gig_submissions_unified_view
WITH (security_invoker = true) AS
SELECT s.id AS submission_id, 'quick'::text AS gig_kind, s.gig_id, s.talent_id,
  s.status, s.submission_data AS payload, s.created_at, s.reviewed_at
FROM public.gig_submissions s
UNION ALL
SELECT d.id AS submission_id, 'marketplace'::text AS gig_kind, c.gig_id, c.freelancer_id AS talent_id,
  d.status, jsonb_build_object('title', d.title, 'description', d.description, 'file_url', d.file_url) AS payload,
  d.created_at, d.reviewed_at
FROM public.marketplace_deliverables d
JOIN public.marketplace_contracts c ON c.id = d.contract_id;

-- verification_rules
CREATE TABLE IF NOT EXISTS public.verification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_kind text NOT NULL CHECK (gig_kind = ANY (ARRAY['quick','marketplace','content'])),
  category text,
  auto_approve_floor numeric(4,2) NOT NULL DEFAULT 0.85,
  escalate_floor numeric(4,2) NOT NULL DEFAULT 0.55,
  max_revisions int NOT NULL DEFAULT 2,
  revision_due_hours int NOT NULL DEFAULT 48,
  risk_flag_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gig_kind, category)
);
ALTER TABLE public.verification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read verification rules" ON public.verification_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage verification rules" ON public.verification_rules
  FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));
INSERT INTO public.verification_rules (gig_kind, category, auto_approve_floor, escalate_floor) VALUES
  ('quick', NULL, 0.85, 0.55),
  ('marketplace', NULL, 0.85, 0.55),
  ('content', NULL, 0.88, 0.60)
ON CONFLICT DO NOTHING;

-- gig_verifications
CREATE TABLE IF NOT EXISTS public.gig_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  gig_kind text NOT NULL CHECK (gig_kind = ANY (ARRAY['quick','marketplace','content'])),
  gig_id uuid,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  verdict text NOT NULL DEFAULT 'pending' CHECK (verdict = ANY (ARRAY['pending','auto_approved','auto_revise','escalated','human_approved','human_rejected'])),
  score numeric(5,2),
  criteria_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  rationale text,
  suggested_revisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  tokens_used int,
  latency_ms int,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, gig_kind)
);
CREATE INDEX IF NOT EXISTS idx_gig_verifications_talent ON public.gig_verifications(talent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gig_verifications_verdict ON public.gig_verifications(verdict, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gig_verifications_gig ON public.gig_verifications(gig_id, gig_kind);
ALTER TABLE public.gig_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talent views own verifications" ON public.gig_verifications
  FOR SELECT TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Poster views verifications on own gig" ON public.gig_verifications
  FOR SELECT TO authenticated
  USING (
    gig_kind = 'marketplace' AND gig_id IN (
      SELECT id FROM public.marketplace_gigs WHERE posted_by = auth.uid()
    )
  );
CREATE POLICY "Admins manage all verifications" ON public.gig_verifications
  FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

-- gig_revision_requests
CREATE TABLE IF NOT EXISTS public.gig_revision_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.gig_verifications(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  summary text NOT NULL,
  required_changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  attempts_remaining int NOT NULL DEFAULT 2,
  due_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open','submitted','expired','closed'])),
  resolution_payload jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revision_requests_talent ON public.gig_revision_requests(talent_id, status);
CREATE INDEX IF NOT EXISTS idx_revision_requests_due ON public.gig_revision_requests(due_at) WHERE status = 'open';
ALTER TABLE public.gig_revision_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talent views own revision requests" ON public.gig_revision_requests
  FOR SELECT TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage revision requests" ON public.gig_revision_requests
  FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

-- gig_verification_appeals
CREATE TABLE IF NOT EXISTS public.gig_verification_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.gig_verifications(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  reason text NOT NULL,
  evidence_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','approved','rejected'])),
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.gig_verification_appeals(status, created_at DESC);
ALTER TABLE public.gig_verification_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talent views own appeals" ON public.gig_verification_appeals
  FOR SELECT TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Talent creates own appeals" ON public.gig_verification_appeals
  FOR INSERT TO authenticated
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage appeals" ON public.gig_verification_appeals
  FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

-- talent_trust_events
CREATE TABLE IF NOT EXISTS public.talent_trust_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event = ANY (ARRAY['verification_pass','verification_fail','revision_accepted','revision_expired','appeal_won','appeal_lost','dispute_lost','poster_override_approve','poster_override_reject'])),
  weight numeric(5,2) NOT NULL DEFAULT 0,
  gig_kind text,
  verification_id uuid REFERENCES public.gig_verifications(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_events_talent ON public.talent_trust_events(talent_id, created_at DESC);
ALTER TABLE public.talent_trust_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talent views own trust events" ON public.talent_trust_events
  FOR SELECT TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage trust events" ON public.talent_trust_events
  FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

CREATE OR REPLACE FUNCTION public.recompute_talent_trust_score_v2(_talent_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_base numeric := 50.0; v_delta numeric := 0; v_score numeric;
BEGIN
  SELECT COALESCE(SUM(weight * CASE WHEN created_at < now() - interval '90 days' THEN 0.5 ELSE 1.0 END), 0)
  INTO v_delta FROM public.talent_trust_events WHERE talent_id = _talent_id;
  v_score := GREATEST(0, LEAST(100, v_base + v_delta));
  INSERT INTO public.talent_trust_score (talent_id, score, components, computed_at, updated_at)
  VALUES (_talent_id, v_score, jsonb_build_object('base', v_base, 'delta', v_delta), now(), now())
  ON CONFLICT (talent_id) DO UPDATE SET score = EXCLUDED.score, components = EXCLUDED.components, computed_at = now(), updated_at = now();
  RETURN v_score;
END; $$;

CREATE OR REPLACE FUNCTION public.tg_trust_event_recompute()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.recompute_talent_trust_score_v2(NEW.talent_id); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_trust_event_recompute ON public.talent_trust_events;
CREATE TRIGGER trg_trust_event_recompute AFTER INSERT ON public.talent_trust_events
FOR EACH ROW EXECUTE FUNCTION public.tg_trust_event_recompute();

-- RPCs
CREATE OR REPLACE FUNCTION public.request_gig_verification(_submission_id uuid, _gig_kind text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing uuid; v_talent_id uuid; v_gig_id uuid; v_new_id uuid;
BEGIN
  SELECT id INTO v_existing FROM public.gig_verifications WHERE submission_id = _submission_id AND gig_kind = _gig_kind;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  IF _gig_kind = 'quick' THEN
    SELECT talent_id, gig_id INTO v_talent_id, v_gig_id FROM public.gig_submissions WHERE id = _submission_id;
  ELSIF _gig_kind = 'marketplace' THEN
    SELECT c.freelancer_id, c.gig_id INTO v_talent_id, v_gig_id
    FROM public.marketplace_deliverables d JOIN public.marketplace_contracts c ON c.id = d.contract_id
    WHERE d.id = _submission_id;
  END IF;
  IF v_talent_id IS NULL THEN RAISE EXCEPTION 'Submission % not found for kind %', _submission_id, _gig_kind; END IF;
  INSERT INTO public.gig_verifications (submission_id, gig_kind, gig_id, talent_id, verdict)
  VALUES (_submission_id, _gig_kind, v_gig_id, v_talent_id, 'pending') RETURNING id INTO v_new_id;
  RETURN v_new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.apply_verification_verdict(_verification_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ver public.gig_verifications; v_rule public.verification_rules;
BEGIN
  SELECT * INTO v_ver FROM public.gig_verifications WHERE id = _verification_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verification not found'; END IF;
  SELECT * INTO v_rule FROM public.verification_rules WHERE gig_kind = v_ver.gig_kind AND category IS NULL AND is_active LIMIT 1;
  IF v_ver.gig_kind = 'quick' THEN
    UPDATE public.gig_submissions
    SET status = CASE WHEN v_ver.verdict IN ('auto_approved','human_approved') THEN 'approved'
      WHEN v_ver.verdict = 'human_rejected' THEN 'rejected'
      WHEN v_ver.verdict = 'auto_revise' THEN 'revision_requested' ELSE status END,
      ai_score = v_ver.score, ai_feedback = v_ver.rationale, auto_decision = v_ver.verdict, processed_at = now()
    WHERE id = v_ver.submission_id;
  ELSIF v_ver.gig_kind = 'marketplace' THEN
    UPDATE public.marketplace_deliverables
    SET status = CASE WHEN v_ver.verdict IN ('auto_approved','human_approved') THEN 'approved'
      WHEN v_ver.verdict = 'human_rejected' THEN 'rejected'
      WHEN v_ver.verdict = 'auto_revise' THEN 'revision_requested' ELSE status END,
      reviewed_at = now(), admin_notes = COALESCE(v_ver.rationale, admin_notes)
    WHERE id = v_ver.submission_id;
  END IF;
  IF v_ver.verdict = 'auto_revise' THEN
    INSERT INTO public.gig_revision_requests (verification_id, talent_id, summary, required_changes, attempts_remaining, due_at)
    VALUES (v_ver.id, v_ver.talent_id, COALESCE(v_ver.rationale,'Revisions requested'),
      v_ver.suggested_revisions, COALESCE(v_rule.max_revisions, 2),
      now() + (COALESCE(v_rule.revision_due_hours, 48) || ' hours')::interval)
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.talent_trust_events (talent_id, event, weight, gig_kind, verification_id, metadata)
  SELECT v_ver.talent_id,
    CASE v_ver.verdict WHEN 'auto_approved' THEN 'verification_pass' WHEN 'human_approved' THEN 'verification_pass' WHEN 'human_rejected' THEN 'verification_fail' ELSE NULL END,
    CASE v_ver.verdict WHEN 'auto_approved' THEN 2.0 WHEN 'human_approved' THEN 3.0 WHEN 'human_rejected' THEN -5.0 ELSE 0 END,
    v_ver.gig_kind, v_ver.id, jsonb_build_object('score', v_ver.score)
  WHERE v_ver.verdict IN ('auto_approved','human_approved','human_rejected');
END; $$;

CREATE OR REPLACE FUNCTION public.submit_revision(_revision_id uuid, _payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rev public.gig_revision_requests; v_ver public.gig_verifications;
BEGIN
  SELECT * INTO v_rev FROM public.gig_revision_requests WHERE id = _revision_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Revision request not found'; END IF;
  IF v_rev.talent_id NOT IN (SELECT id FROM public.talents WHERE user_id = auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_rev.attempts_remaining <= 0 OR v_rev.status <> 'open' THEN RAISE EXCEPTION 'No attempts remaining'; END IF;
  UPDATE public.gig_revision_requests
  SET attempts_remaining = attempts_remaining - 1, resolution_payload = _payload,
      status = CASE WHEN attempts_remaining - 1 <= 0 THEN 'closed' ELSE status END, updated_at = now()
  WHERE id = _revision_id;
  SELECT * INTO v_ver FROM public.gig_verifications WHERE id = v_rev.verification_id;
  UPDATE public.gig_verifications SET verdict = 'pending', updated_at = now() WHERE id = v_rev.verification_id;
  IF v_ver.gig_kind = 'quick' THEN
    UPDATE public.gig_submissions
      SET status = 'pending', submission_data = COALESCE(submission_data,'{}'::jsonb) || jsonb_build_object('revision', _payload)
      WHERE id = v_ver.submission_id;
  ELSIF v_ver.gig_kind = 'marketplace' THEN
    UPDATE public.marketplace_deliverables
      SET status = 'submitted', description = COALESCE(_payload->>'description', description), file_url = COALESCE(_payload->>'file_url', file_url)
      WHERE id = v_ver.submission_id;
  END IF;
  RETURN v_rev.verification_id;
END; $$;

CREATE OR REPLACE FUNCTION public.open_verification_appeal(_verification_id uuid, _reason text, _evidence jsonb DEFAULT '[]'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ver public.gig_verifications; v_id uuid;
BEGIN
  SELECT * INTO v_ver FROM public.gig_verifications WHERE id = _verification_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verification not found'; END IF;
  IF v_ver.talent_id NOT IN (SELECT id FROM public.talents WHERE user_id = auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.gig_verification_appeals (verification_id, talent_id, reason, evidence_links)
  VALUES (_verification_id, v_ver.talent_id, _reason, COALESCE(_evidence,'[]'::jsonb)) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.resolve_verification_appeal(_appeal_id uuid, _decision text, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_appeal public.gig_verification_appeals;
BEGIN
  IF NOT has_any_admin_role(auth.uid()) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT * INTO v_appeal FROM public.gig_verification_appeals WHERE id = _appeal_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appeal not found'; END IF;
  UPDATE public.gig_verification_appeals SET status = _decision, resolution_notes = _notes, resolved_by = auth.uid(), resolved_at = now() WHERE id = _appeal_id;
  IF _decision = 'approved' THEN
    UPDATE public.gig_verifications SET verdict = 'human_approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() WHERE id = v_appeal.verification_id;
    PERFORM public.apply_verification_verdict(v_appeal.verification_id);
    INSERT INTO public.talent_trust_events (talent_id, event, weight, verification_id) VALUES (v_appeal.talent_id, 'appeal_won', 4.0, v_appeal.verification_id);
  ELSE
    INSERT INTO public.talent_trust_events (talent_id, event, weight, verification_id) VALUES (v_appeal.talent_id, 'appeal_lost', -3.0, v_appeal.verification_id);
  END IF;
END; $$;
