-- Seed tool bindings for Batch 1 Admin Agents
-- Nia: business-analyst
-- Report Builder: report-builder
-- Aisha: talent-aisha
-- Agent Manager: agent-manager

-- 1. Bind Nia (business-analyst) to her tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'business-analyst'
   AND t.tool_key IN ('get_credit_balance', 'get_ledger', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 2. Bind Report Builder to its tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'report-builder'
   AND t.tool_key IN ('get_ledger', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 3. Bind Aisha (talent-aisha) to her tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'talent-aisha'
   AND t.tool_key IN ('search_talent', 'reveal_talent', 'list_shortlist', 'score_talent_match', 'search_kb')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 4. Bind Agent Manager to its tools
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key = 'agent-manager'
   AND t.tool_key IN ('get_ledger', 'get_credit_balance', 'search_kb', 'award_credits')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 5. Bind generic admin tools to all admin agents
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.audience = 'admin'
   AND t.tool_key IN ('award_credits', 'notify_admin')
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- 6. Mirror all bindings into ai_agents.allowed_tools for runtime discovery
UPDATE public.ai_agents a
   SET allowed_tools = COALESCE((
        SELECT array_agg(DISTINCT t.tool_key)
          FROM public.agent_tool_bindings b
          JOIN public.agent_tools t ON t.id = b.tool_id
         WHERE b.agent_id = a.id), a.allowed_tools)
 WHERE a.audience = 'admin';
