
-- ============================================================
-- Phase 5.1 cleanup: parity columns
-- ============================================================
ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deadline timestamptz;

ALTER TABLE public.marketplace_gigs
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

-- ============================================================
-- Unified view across quick gigs + marketplace gigs
-- ============================================================
CREATE OR REPLACE VIEW public.gigs_unified_view AS
SELECT
  id,
  'quick'::text AS kind,
  title,
  description,
  category AS skill_category,
  skills,
  credit_reward AS credits,
  deadline,
  CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status,
  acceptance_criteria,
  NULL::uuid AS posted_by,
  created_at,
  updated_at
FROM public.gigs
UNION ALL
SELECT
  id,
  'marketplace'::text AS kind,
  title,
  description,
  skill_category,
  skills,
  budget_amount AS credits,
  deadline,
  status,
  acceptance_criteria,
  posted_by,
  created_at,
  updated_at
FROM public.marketplace_gigs;

-- ============================================================
-- talent_trust_score
-- ============================================================
CREATE TABLE IF NOT EXISTS public.talent_trust_score (
  talent_id uuid PRIMARY KEY REFERENCES public.talents(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL DEFAULT 50.00,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_trust_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents can view own trust score"
  ON public.talent_trust_score FOR SELECT
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage trust score"
  ON public.talent_trust_score FOR ALL
  TO authenticated
  USING (has_any_admin_role(auth.uid()))
  WITH CHECK (has_any_admin_role(auth.uid()));

-- ============================================================
-- talent_availability
-- ============================================================
CREATE TABLE IF NOT EXISTS public.talent_availability (
  talent_id uuid PRIMARY KEY REFERENCES public.talents(id) ON DELETE CASCADE,
  weekly_capacity_hours integer NOT NULL DEFAULT 10,
  paused_until timestamptz,
  categories text[] NOT NULL DEFAULT '{}',
  notify_via_email boolean NOT NULL DEFAULT true,
  notify_via_inapp boolean NOT NULL DEFAULT true,
  daily_match_cap integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents read own availability"
  ON public.talent_availability FOR SELECT
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Talents upsert own availability"
  ON public.talent_availability FOR INSERT
  TO authenticated
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Talents update own availability"
  ON public.talent_availability FOR UPDATE
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all availability"
  ON public.talent_availability FOR SELECT
  TO authenticated
  USING (has_any_admin_role(auth.uid()));

-- ============================================================
-- gig_matches
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gig_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL,
  gig_kind text NOT NULL CHECK (gig_kind IN ('quick','marketplace')),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL DEFAULT 0,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  why_text text,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered','viewed','dismissed','bid','shortlisted','won','lost','expired')),
  offered_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gig_id, gig_kind, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_gig_matches_talent ON public.gig_matches(talent_id, status, score DESC);
CREATE INDEX IF NOT EXISTS idx_gig_matches_gig ON public.gig_matches(gig_id, gig_kind, score DESC);
ALTER TABLE public.gig_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents view own matches"
  ON public.gig_matches FOR SELECT
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Talents update own match status"
  ON public.gig_matches FOR UPDATE
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Posters view matches on own marketplace gigs"
  ON public.gig_matches FOR SELECT
  TO authenticated
  USING (
    gig_kind = 'marketplace'
    AND EXISTS (SELECT 1 FROM public.marketplace_gigs mg WHERE mg.id = gig_matches.gig_id AND mg.posted_by = auth.uid())
  );

CREATE POLICY "Admins manage all matches"
  ON public.gig_matches FOR ALL
  TO authenticated
  USING (has_any_admin_role(auth.uid()))
  WITH CHECK (has_any_admin_role(auth.uid()));

-- ============================================================
-- gig_match_digests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gig_match_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  digest_date date NOT NULL DEFAULT current_date,
  match_count integer NOT NULL DEFAULT 0,
  match_ids uuid[] NOT NULL DEFAULT '{}',
  sent_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'email',
  UNIQUE (talent_id, digest_date, channel)
);
ALTER TABLE public.gig_match_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents view own digests"
  ON public.gig_match_digests FOR SELECT
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage digests"
  ON public.gig_match_digests FOR ALL
  TO authenticated
  USING (has_any_admin_role(auth.uid()))
  WITH CHECK (has_any_admin_role(auth.uid()));

-- ============================================================
-- marketplace_bids extensions
-- ============================================================
ALTER TABLE public.marketplace_bids
  ADD COLUMN IF NOT EXISTS ai_rationale jsonb,
  ADD COLUMN IF NOT EXISTS proof_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS coached_text text,
  ADD COLUMN IF NOT EXISTS original_text text,
  ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.gig_matches(id) ON DELETE SET NULL;

-- ============================================================
-- RPC: match_talents_to_gig
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_talents_to_gig(
  _gig_id uuid,
  _gig_kind text DEFAULT 'marketplace',
  _limit integer DEFAULT 25
) RETURNS TABLE (
  talent_id uuid,
  score numeric,
  signals jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gig record;
BEGIN
  -- Pull the gig from unified view
  SELECT * INTO v_gig FROM public.gigs_unified_view
  WHERE id = _gig_id AND kind = _gig_kind LIMIT 1;
  IF v_gig IS NULL THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      t.id AS talent_id,
      -- Skill mastery overlap
      COALESCE((
        SELECT AVG(tsp.mastery)
        FROM public.talent_skill_profile tsp
        WHERE tsp.talent_id = t.id
          AND (
            tsp.topic_tag = ANY (v_gig.skills)
            OR v_gig.skill_category IS NULL
            OR tsp.topic_tag ILIKE '%' || v_gig.skill_category || '%'
          )
      ), 0)::numeric AS skill_score,
      -- Trust score (0-100 → 0-1)
      COALESCE((SELECT score FROM public.talent_trust_score WHERE talent_id = t.id) / 100.0, 0.5)::numeric AS trust_score,
      -- Availability factor
      COALESCE((
        SELECT CASE
          WHEN ta.paused_until IS NOT NULL AND ta.paused_until > now() THEN 0
          WHEN ta.weekly_capacity_hours <= 0 THEN 0.2
          ELSE LEAST(1.0, ta.weekly_capacity_hours / 20.0)
        END
        FROM public.talent_availability ta WHERE ta.talent_id = t.id
      ), 0.5)::numeric AS availability_score,
      -- Past wins
      COALESCE((
        SELECT COUNT(*) FILTER (WHERE mb.status = 'accepted')::numeric / GREATEST(COUNT(*),1)
        FROM public.marketplace_bids mb WHERE mb.talent_id = t.id
      ), 0)::numeric AS win_rate
    FROM public.talents t
    WHERE t.user_id IS NOT NULL
  ),
  scored AS (
    SELECT
      c.talent_id,
      ROUND(((c.skill_score * 0.45) + (c.trust_score * 0.25) + (c.availability_score * 0.15) + (c.win_rate * 0.15)) * 100, 2) AS score,
      jsonb_build_object(
        'skill', round(c.skill_score, 3),
        'trust', round(c.trust_score, 3),
        'availability', round(c.availability_score, 3),
        'win_rate', round(c.win_rate, 3)
      ) AS signals
    FROM candidates c
  )
  SELECT s.talent_id, s.score, s.signals
  FROM scored s
  ORDER BY s.score DESC
  LIMIT _limit;
END;
$$;

-- ============================================================
-- RPC: upsert matches (called by cron / on-demand)
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_gig_matches(
  _gig_id uuid,
  _gig_kind text DEFAULT 'marketplace',
  _limit integer DEFAULT 25
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN SELECT * FROM public.match_talents_to_gig(_gig_id, _gig_kind, _limit)
  LOOP
    INSERT INTO public.gig_matches (gig_id, gig_kind, talent_id, score, signals, status)
    VALUES (_gig_id, _gig_kind, r.talent_id, r.score, r.signals, 'offered')
    ON CONFLICT (gig_id, gig_kind, talent_id)
    DO UPDATE SET score = EXCLUDED.score, signals = EXCLUDED.signals, updated_at = now();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ============================================================
-- RPC: match_gigs_for_talent
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_gigs_for_talent(
  _talent_id uuid,
  _limit integer DEFAULT 20
) RETURNS TABLE (
  match_id uuid,
  gig_id uuid,
  gig_kind text,
  title text,
  credits integer,
  deadline timestamptz,
  score numeric,
  signals jsonb,
  status text,
  why_text text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.gig_id, m.gig_kind, g.title, g.credits, g.deadline, m.score, m.signals, m.status, m.why_text
  FROM public.gig_matches m
  JOIN public.gigs_unified_view g ON g.id = m.gig_id AND g.kind = m.gig_kind
  WHERE m.talent_id = _talent_id
    AND m.status NOT IN ('expired','dismissed')
    AND m.expires_at > now()
  ORDER BY m.score DESC
  LIMIT _limit;
$$;

-- ============================================================
-- RPC: record_match_event
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_match_event(
  _match_id uuid,
  _event text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event NOT IN ('view','dismiss','bid','shortlist','won','lost') THEN
    RAISE EXCEPTION 'Invalid event %', _event;
  END IF;
  UPDATE public.gig_matches
  SET
    status = CASE
      WHEN _event = 'view' AND status = 'offered' THEN 'viewed'
      WHEN _event = 'dismiss' THEN 'dismissed'
      WHEN _event = 'bid' THEN 'bid'
      WHEN _event = 'shortlist' THEN 'shortlisted'
      WHEN _event = 'won' THEN 'won'
      WHEN _event = 'lost' THEN 'lost'
      ELSE status
    END,
    viewed_at = COALESCE(viewed_at, CASE WHEN _event = 'view' THEN now() END),
    updated_at = now()
  WHERE id = _match_id;
END;
$$;

-- ============================================================
-- RPC: shortlist_match (poster action)
-- ============================================================
CREATE OR REPLACE FUNCTION public.shortlist_match(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match record;
  v_owner uuid;
BEGIN
  SELECT * INTO v_match FROM public.gig_matches WHERE id = _match_id;
  IF v_match IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF v_match.gig_kind = 'marketplace' THEN
    SELECT posted_by INTO v_owner FROM public.marketplace_gigs WHERE id = v_match.gig_id;
    IF v_owner <> auth.uid() AND NOT has_any_admin_role(auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;
  UPDATE public.gig_matches SET status = 'shortlisted', updated_at = now() WHERE id = _match_id;
END;
$$;

-- ============================================================
-- RPC: recompute_talent_trust_score
-- ============================================================
CREATE OR REPLACE FUNCTION public.recompute_talent_trust_score(_talent_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_age_days integer;
  v_completed integer;
  v_disputes integer;
  v_score numeric;
BEGIN
  SELECT GREATEST(0, EXTRACT(DAY FROM now() - created_at)::integer)
    INTO v_account_age_days FROM public.talents WHERE id = _talent_id;
  SELECT COUNT(*) INTO v_completed FROM public.marketplace_bids
    WHERE talent_id = _talent_id AND status = 'accepted';
  v_disputes := 0;
  v_score := LEAST(100, 40
    + LEAST(20, v_account_age_days::numeric / 30 * 5)
    + LEAST(40, v_completed * 5)
    - (v_disputes * 10));
  INSERT INTO public.talent_trust_score (talent_id, score, components, computed_at, updated_at)
  VALUES (_talent_id, v_score, jsonb_build_object(
    'account_age_days', v_account_age_days,
    'completed_gigs', v_completed,
    'disputes', v_disputes
  ), now(), now())
  ON CONFLICT (talent_id) DO UPDATE SET
    score = EXCLUDED.score,
    components = EXCLUDED.components,
    computed_at = now(),
    updated_at = now();
  RETURN v_score;
END;
$$;

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE TRIGGER update_gig_matches_updated_at
  BEFORE UPDATE ON public.gig_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_talent_availability_updated_at
  BEFORE UPDATE ON public.talent_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
