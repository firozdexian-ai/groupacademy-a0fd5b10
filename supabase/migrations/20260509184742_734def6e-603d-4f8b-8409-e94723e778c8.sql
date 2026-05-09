
INSERT INTO public.ai_agents (agent_key, name, description, audience, system_prompt, is_active, kill_switch, owner_kind)
VALUES
  ('fin-controller', 'Finance Controller',
   'Admin operator: approves/rejects instructor payouts and awards credits.',
   'admin',
   'You are the Finance Controller for GroUp Academy admins. You can approve or reject instructor payout requests and award credits to talents. Always confirm the request id and reason before mutating. Be concise and decisive.',
   true, false, 'platform'),
  ('talent-aisha', 'Aisha — Talent Success',
   'Admin operator: talent pool insights and bonus credit awards.',
   'admin',
   'You are Aisha, the Talent Success operator. You can award bonus credits to talents and answer questions about the talent pool. Confirm talent_id and amount before awarding.',
   true, false, 'platform'),
  ('gig-ops', 'Gig Ops Manager',
   'Admin operator: gig matching and verification oversight.',
   'admin',
   'You are the Gig Ops Manager. You oversee gig matching and verification. You can force-run the matchmaker for a specific gig. Be operational and decisive.',
   true, false, 'platform')
ON CONFLICT (agent_key) DO UPDATE
  SET audience = EXCLUDED.audience,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      system_prompt = EXCLUDED.system_prompt,
      is_active = true,
      kill_switch = false,
      updated_at = now();

INSERT INTO public.agent_tools
  (tool_key, name, description, category, audience, min_level, default_credit_cost,
   handler_kind, handler_ref, input_schema, is_active, status)
VALUES
  ('approve_payout',
   'Approve instructor payout',
   'Approve a pending instructor payout request and mark the underlying ledger rows as paid.',
   'finance', ARRAY['admin'], 1, 0,
   'edge_function', 'admin-agent-tools',
   '{"type":"object","required":["request_id"],"properties":{"request_id":{"type":"string"},"notes":{"type":"string"},"fx_rate":{"type":"number"}}}'::jsonb,
   true, 'available'),
  ('reject_payout',
   'Reject instructor payout',
   'Reject a pending instructor payout request and release escrow back to available balance.',
   'finance', ARRAY['admin'], 1, 0,
   'edge_function', 'admin-agent-tools',
   '{"type":"object","required":["request_id"],"properties":{"request_id":{"type":"string"},"notes":{"type":"string"}}}'::jsonb,
   true, 'available'),
  ('force_run_matchmaker',
   'Force run gig matchmaker',
   'Trigger the gig matchmaker immediately for a specific gig (or globally) instead of waiting for the cron.',
   'gigs', ARRAY['admin'], 1, 0,
   'edge_function', 'admin-agent-tools',
   '{"type":"object","properties":{"gig_id":{"type":"string"}}}'::jsonb,
   true, 'available'),
  ('award_credits',
   'Award credits to talent',
   'Issue bonus credits to a specific talent with a reason. Audited as admin source.',
   'finance', ARRAY['admin'], 1, 0,
   'edge_function', 'admin-agent-tools',
   '{"type":"object","required":["talent_id","amount"],"properties":{"talent_id":{"type":"string"},"amount":{"type":"number","minimum":1},"reason":{"type":"string"}}}'::jsonb,
   true, 'available')
ON CONFLICT (tool_key) DO UPDATE
  SET description = EXCLUDED.description,
      audience = EXCLUDED.audience,
      handler_kind = EXCLUDED.handler_kind,
      handler_ref = EXCLUDED.handler_ref,
      input_schema = EXCLUDED.input_schema,
      is_active = true,
      status = 'available',
      updated_at = now();

WITH a AS (
  SELECT id, agent_key FROM public.ai_agents
   WHERE agent_key IN ('fin-controller','talent-aisha','gig-ops')
), t AS (
  SELECT id, tool_key FROM public.agent_tools
   WHERE tool_key IN ('approve_payout','reject_payout','force_run_matchmaker','award_credits')
)
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM a JOIN t ON
     (a.agent_key='fin-controller' AND t.tool_key IN ('approve_payout','reject_payout','award_credits'))
  OR (a.agent_key='talent-aisha'   AND t.tool_key IN ('award_credits'))
  OR (a.agent_key='gig-ops'        AND t.tool_key IN ('force_run_matchmaker'))
ON CONFLICT DO NOTHING;
