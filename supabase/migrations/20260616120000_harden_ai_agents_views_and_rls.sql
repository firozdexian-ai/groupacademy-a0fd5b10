-- Step 1: Create the admin_ai_agents view with security_invoker
DROP VIEW IF EXISTS public.admin_ai_agents;

CREATE VIEW public.admin_ai_agents 
WITH (security_invoker = true)
AS 
  SELECT a.*, COALESCE(t.full_name, c.name) AS owner_name 
  FROM public.ai_agents a 
  LEFT JOIN public.talents t ON a.owner_kind='talent' AND a.owner_id=t.id 
  LEFT JOIN public.companies c ON a.owner_kind='company' AND a.owner_id=c.id;

GRANT SELECT ON public.admin_ai_agents TO authenticated, service_role;


-- Step 2: Add review_notes to ai_agents_with_stats view
DROP VIEW IF EXISTS public.ai_agents_with_stats;

CREATE VIEW public.ai_agents_with_stats
AS
SELECT
  a.id,
  a.agent_key,
  a.name,
  a.description,
  a.icon,
  a.color,
  a.bg_color,
  a.expertise_areas,
  a.is_active,
  a.display_order,
  a.created_at,
  a.updated_at,
  a.avatar_url,
  a.credit_cost,
  a.session_duration_minutes,
  a.agent_type,
  a.company_id,
  a.capabilities,
  a.personality_traits,
  a.sample_conversations,
  a.total_conversations,
  a.average_rating,
  a.is_featured,
  a.category,
  a.owner_kind,
  a.owner_id,
  a.audience,
  a.agent_level,
  a.connection_fee,
  a.message_credit_cost,
  a.visibility,
  a.marketplace_status,
  a.active_prompt_variant,
  a.canvas_mode,
  a.country_code,
  a.profession_line_id,
  a.goal,
  a.region,
  a.language,
  a.default_channel,
  a.review_notes,
  COALESCE(s.total_users, 0)    AS total_users,
  COALESCE(s.total_messages, 0) AS total_messages,
  COALESCE(r.avg_rating, 0)     AS avg_rating,
  COALESCE(r.review_count, 0)   AS review_count
FROM public.ai_agents a
LEFT JOIN (
  SELECT agent_key,
         COUNT(DISTINCT talent_id) AS total_users,
         COALESCE(SUM(jsonb_array_length(messages)), 0) AS total_messages
    FROM public.agent_chat_sessions
   WHERE messages IS NOT NULL
   GROUP BY agent_key
) s ON s.agent_key = a.agent_key
LEFT JOIN (
  SELECT agent_key,
         AVG(rating)::numeric(3,2) AS avg_rating,
         COUNT(*) AS review_count
    FROM public.agent_reviews
   GROUP BY agent_key
) r ON r.agent_key = a.agent_key;

GRANT SELECT ON public.ai_agents_with_stats TO anon, authenticated;


-- Step 3: Tighten RLS policies on ai_agents
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.ai_agents;

CREATE POLICY "Anyone can view active approved public agents or owned agents"
ON public.ai_agents FOR SELECT
USING (
  (is_active = true AND (visibility = 'public' OR visibility = 'marketplace') AND marketplace_status = 'approved')
  OR 
  (owner_kind = 'talent' AND owner_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()))
  OR
  (owner_kind = 'company' AND owner_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()))
  OR
  (public.has_any_admin_role(auth.uid()))
);

-- Talent Write Policies
CREATE POLICY "Talents can insert own agents"
ON public.ai_agents FOR INSERT
WITH CHECK (
  owner_kind = 'talent' AND owner_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

CREATE POLICY "Talents can update own agents"
ON public.ai_agents FOR UPDATE
USING (
  owner_kind = 'talent' AND owner_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
)
WITH CHECK (
  owner_kind = 'talent' AND owner_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

CREATE POLICY "Talents can delete own agents"
ON public.ai_agents FOR DELETE
USING (
  owner_kind = 'talent' AND owner_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

-- Company Write Policies
CREATE POLICY "Companies can insert own agents"
ON public.ai_agents FOR INSERT
WITH CHECK (
  owner_kind = 'company' AND owner_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
);

CREATE POLICY "Companies can update own agents"
ON public.ai_agents FOR UPDATE
USING (
  owner_kind = 'company' AND owner_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
)
WITH CHECK (
  owner_kind = 'company' AND owner_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
);

CREATE POLICY "Companies can delete own agents"
ON public.ai_agents FOR DELETE
USING (
  owner_kind = 'company' AND owner_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
);
