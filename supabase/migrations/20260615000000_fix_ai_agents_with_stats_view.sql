-- Redefine ai_agents_with_stats view to explicitly select only allowed columns
DROP VIEW IF EXISTS public.ai_agents_with_stats;

CREATE VIEW public.ai_agents_with_stats
WITH (security_invoker = true)
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

-- Create a secure view for administrators to manage agent details including restricted columns
DROP VIEW IF EXISTS public.admin_ai_agents;

CREATE VIEW public.admin_ai_agents
AS
SELECT *
FROM public.ai_agents
WHERE has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_ai_agents TO authenticated;
