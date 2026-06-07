-- Seed tool bindings for Batch 4 Admin Agents
-- 1. Institutions Outreach Exec (inst-outreach)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'inst-outreach'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 2. Organizations Analyst (inst-analyst)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'inst-analyst'
   AND t.tool_key IN ('search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 3. HR Admin / Onboarding (hr-onboarding)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'hr-onboarding'
   AND t.tool_key IN ('list_teammates', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 4. Abroad Counselor (abroad-counselor)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'abroad-counselor'
   AND t.tool_key IN ('search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 5. IELTS Coach (abroad-ielts)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'abroad-ielts'
   AND t.tool_key IN ('search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 6. Abroad Outreach Exec (abroad-outreach)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'abroad-outreach'
   AND t.tool_key IN ('generate_outreach', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 7. Marketing Strategist (mkt-strategist)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'mkt-strategist'
   AND t.tool_key IN ('search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 8. Credits Ops (fin-credits-ops)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'fin-credits-ops'
   AND t.tool_key IN ('award_credits', 'get_credit_balance', 'get_ledger', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 9. Finance Controller (fin-controller)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'fin-controller'
   AND t.tool_key IN ('get_credit_balance', 'get_ledger', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 10. Gig Ops Manager (gig-ops)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'gig-ops'
   AND t.tool_key IN ('approve_payout', 'reject_payout', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 11. Mirror all bindings into ai_agents.allowed_tools for runtime discovery
UPDATE public.ai_agents a
   SET allowed_tools = COALESCE((
        SELECT array_agg(DISTINCT t.tool_key)
          FROM public.agent_tool_bindings b
          JOIN public.agent_tools t ON t.id = b.tool_id
         WHERE b.agent_id = a.id), a.allowed_tools)
  WHERE a.audience = 'admin';
