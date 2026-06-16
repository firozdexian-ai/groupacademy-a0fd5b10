DROP VIEW IF EXISTS public.admin_ai_agents;

CREATE VIEW public.admin_ai_agents AS
  SELECT * FROM public.ai_agents
  WHERE has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_ai_agents TO authenticated;
