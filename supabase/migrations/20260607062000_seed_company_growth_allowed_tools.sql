-- Append feed post drafting tools to company_growth allowed_tools array
UPDATE public.ai_agents
   SET allowed_tools = (
         SELECT array_agg(DISTINCT t)
         FROM unnest(coalesce(allowed_tools, ARRAY[]::text[]) || ARRAY[
           'draft_company_post',
           'list_pending_drafts',
           'publish_company_post',
           'discard_company_draft',
           'list_my_jobs',
           'get_credit_balance',
           'search_kb'
         ]) AS t
       )
 WHERE agent_key = 'company_growth';
