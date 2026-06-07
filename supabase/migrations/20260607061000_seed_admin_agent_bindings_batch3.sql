-- Seed tool bindings for Batch 3 Admin Agents
-- 1. Country Agent (gtm-country)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'gtm-country'
   AND t.tool_key IN ('search_talent', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 2. Academies & Schools Dean (learn-dean)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'learn-dean'
   AND t.tool_key IN ('draft_module_outline', 'approve_payout', 'reject_payout', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 3. Gig Category Agent (gig-category)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'gig-category'
   AND t.tool_key IN ('force_run_matchmaker', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 4. Blog Post Agent (ugc-blog)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ugc-blog'
   AND t.tool_key IN ('compose_feed_post', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 5. Feed Post Agent (ugc-feed)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ugc-feed'
   AND t.tool_key IN ('compose_feed_post', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 6. Free Video Agent (ugc-video)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ugc-video'
   AND t.tool_key IN ('compose_feed_post', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 7. Competition & Event Agent (ugc-events)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ugc-events'
   AND t.tool_key IN ('create_poll', 'compose_feed_post', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 8. UGC Outreach Agent (ugc-outreach)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ugc-outreach'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 9. Jobs Outreach Agent (jobs-outreach)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'jobs-outreach'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 10. Company Outreach Exec (companies-outreach)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'companies-outreach'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 11. AI General (Companies) (companies-ai-general)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'companies-ai-general'
   AND t.tool_key IN ('get_company_profile', 'list_my_jobs', 'get_job_applicants', 'search_talent', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 12. AI General (Talent) (talent-ai-general)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'talent-ai-general'
   AND t.tool_key IN ('search_talent', 'list_shortlist', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 13. Talent Outreach Exec (talent-outreach)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'talent-outreach'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 14. Mirror all bindings into ai_agents.allowed_tools for runtime discovery
UPDATE public.ai_agents a
   SET allowed_tools = COALESCE((
        SELECT array_agg(DISTINCT t.tool_key)
          FROM public.agent_tool_bindings b
          JOIN public.agent_tools t ON t.id = b.tool_id
         WHERE b.agent_id = a.id), a.allowed_tools)
  WHERE a.audience = 'admin';
