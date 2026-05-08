
-- ============ PHASE A: Routing primitives ============

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS profession_line_id uuid REFERENCES public.profession_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS language text;

CREATE INDEX IF NOT EXISTS idx_ai_agents_routing
  ON public.ai_agents (audience, country_code, profession_line_id, goal)
  WHERE is_active = true;

-- Replace single-column UNIQUE with composite (agent_key, region)
ALTER TABLE public.messaging_channels
  DROP CONSTRAINT IF EXISTS messaging_channels_agent_key_unique;

ALTER TABLE public.messaging_channels
  ADD CONSTRAINT messaging_channels_agent_key_region_unique
  UNIQUE (agent_key, region);

-- The Brain: resolve_agent
CREATE OR REPLACE FUNCTION public.resolve_agent(
  p_audience      text,
  p_country       text DEFAULT NULL,
  p_profession_id uuid DEFAULT NULL,
  p_goal          text DEFAULT NULL
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agent_key
  FROM public.ai_agents
  WHERE is_active = true
    AND kill_switch = false
    AND (audience = p_audience OR audience = 'any')
  ORDER BY
    -- Specificity score: exact matches worth more than NULL wildcards
    (CASE WHEN p_country       IS NOT NULL AND country_code       = p_country       THEN 4 ELSE 0 END)
  + (CASE WHEN p_profession_id IS NOT NULL AND profession_line_id = p_profession_id THEN 4 ELSE 0 END)
  + (CASE WHEN p_goal          IS NOT NULL AND goal               = p_goal          THEN 3 ELSE 0 END)
  + (CASE WHEN audience = p_audience THEN 1 ELSE 0 END)
    DESC,
    agent_level DESC,
    display_order ASC,
    agent_key ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_agent(text, text, uuid, text) TO authenticated, anon;

-- ============ PHASE B: Instructors as Profile Coaches ============

ALTER TABLE public.ai_instructors
  ADD COLUMN IF NOT EXISTS profile_coach_prompt text;

CREATE OR REPLACE FUNCTION public.sync_instructor_to_ai_agent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capabilities text[];
BEGIN
  v_capabilities := ARRAY['instructor', 'school_coach'];
  IF NEW.profile_coach_prompt IS NOT NULL AND length(trim(NEW.profile_coach_prompt)) > 0 THEN
    v_capabilities := v_capabilities || ARRAY['profile_coach'];
  END IF;

  INSERT INTO public.ai_agents (
    agent_key, name, description, system_prompt, avatar_url, expertise_areas,
    is_active, agent_type, category, color, bg_color,
    message_credit_cost, delivery_credit_cost, connection_fee,
    marketplace_status, visibility, owner_kind,
    profession_line_id, capabilities
  )
  VALUES (
    'instructor:' || NEW.id::text,
    NEW.name,
    COALESCE(NEW.persona, 'Academy instructor'),
    COALESCE(NEW.system_prompt, NEW.persona, 'You are an Academy instructor.')
      || COALESCE(E'\n\n--- PROFILE COACH MODE ---\n' || NEW.profile_coach_prompt, ''),
    NEW.avatar_url, NEW.expertise_areas,
    COALESCE(NEW.is_active, true),
    'specialized', 'instructor', '#2A7DDE', '#2A7DDE',
    1, 1, 0, 'approved', 'public', 'platform',
    NEW.profession_line_id, v_capabilities
  )
  ON CONFLICT (agent_key) DO UPDATE
    SET name               = EXCLUDED.name,
        description        = EXCLUDED.description,
        system_prompt      = EXCLUDED.system_prompt,
        avatar_url         = EXCLUDED.avatar_url,
        expertise_areas    = EXCLUDED.expertise_areas,
        is_active          = EXCLUDED.is_active,
        profession_line_id = EXCLUDED.profession_line_id,
        capabilities       = EXCLUDED.capabilities;
  RETURN NEW;
END; $$;

-- Backfill existing instructors so the new profession_line_id + capabilities land on mirrored agents
UPDATE public.ai_instructors SET updated_at = now();

-- ============ Onboarding handoff RPC ============
-- Assigns the talent their domain coach + returns the resolved agent_key
CREATE OR REPLACE FUNCTION public.assign_career_coach(p_profession_id uuid, p_goal text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_talent_id  uuid;
  v_country    text;
  v_instr_id   uuid;
  v_agent_key  text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT id, country INTO v_talent_id, v_country
  FROM public.talents WHERE user_id = v_user_id;

  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_talent');
  END IF;

  SELECT id INTO v_instr_id
  FROM public.ai_instructors
  WHERE profession_line_id = p_profession_id AND is_active = true
  LIMIT 1;

  UPDATE public.talents
     SET career_coach_instructor_id = v_instr_id,
         primary_profession_id      = COALESCE(primary_profession_id, p_profession_id)
   WHERE id = v_talent_id;

  v_agent_key := public.resolve_agent('talent', v_country, p_profession_id, p_goal);

  -- Prefer the bound instructor agent if one exists
  IF v_instr_id IS NOT NULL THEN
    v_agent_key := 'instructor:' || v_instr_id::text;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'instructor_id', v_instr_id,
    'agent_key', v_agent_key
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.assign_career_coach(uuid, text) TO authenticated;
