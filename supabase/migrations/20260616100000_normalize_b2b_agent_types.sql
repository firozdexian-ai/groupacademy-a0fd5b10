-- Normalize B2B agent types to 'company'
UPDATE public.ai_agents
SET agent_type = 'company'
WHERE agent_key IN ('company_talent_scout', 'company_billing', 'company_ops');
