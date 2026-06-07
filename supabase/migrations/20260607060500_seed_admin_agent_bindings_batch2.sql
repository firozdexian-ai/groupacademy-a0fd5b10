-- Seed tool bindings for Batch 2 Admin Agents
-- Riya: companies-riya
-- FP&A Agent: ir-fpa
-- Relationship Exec: ir-relationship-exec
-- CHRO: hr-chro
-- Recruiter: hr-recruiter

-- 1. Bind Riya (companies-riya) to her tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'companies-riya'
   AND t.tool_key IN ('get_company_profile', 'list_my_jobs', 'get_job_applicants', 'search_talent', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 2. Bind FP&A Agent (ir-fpa) to his tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ir-fpa'
   AND t.tool_key IN ('get_ledger', 'get_credit_balance', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 3. Bind Relationship Exec (ir-relationship-exec) to his tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'ir-relationship-exec'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 4. Bind CHRO (hr-chro) to his tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'hr-chro'
   AND t.tool_key IN ('list_teammates', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 5. Bind Recruiter (hr-recruiter) to his tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'hr-recruiter'
   AND t.tool_key IN ('create_job', 'publish_job', 'pause_job', 'close_job', 'search_talent', 'reveal_talent', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 6. Mirror all bindings into ai_agents.allowed_tools for runtime discovery
UPDATE public.ai_agents a
   SET allowed_tools = COALESCE((
        SELECT array_agg(DISTINCT t.tool_key)
          FROM public.agent_tool_bindings b
          JOIN public.agent_tools t ON t.id = b.tool_id
         WHERE b.agent_id = a.id), a.allowed_tools)
 WHERE a.audience = 'admin';
