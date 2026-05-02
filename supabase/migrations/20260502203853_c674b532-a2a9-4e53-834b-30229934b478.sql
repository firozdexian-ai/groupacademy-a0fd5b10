
DROP VIEW IF EXISTS public.v_company_sales_context;

CREATE VIEW public.v_company_sales_context
WITH (security_invoker = true)
AS
SELECT
  l.id AS lead_id,
  l.company_id,
  l.name,
  l.email,
  l.phone,
  l.company_name AS lead_company_name,
  l.title,
  l.stage,
  l.value_usd,
  l.next_action_at,
  l.next_step,
  o.id AS offering_id,
  o.name AS offering_name,
  o.kind AS offering_kind,
  o.price_min,
  o.price_max,
  o.currency,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'activity_type', a.activity_type,
      'body', a.body,
      'created_at', a.created_at
    ) ORDER BY a.created_at DESC)
    FROM (
      SELECT activity_type, body, created_at
      FROM public.company_lead_activities
      WHERE lead_id = l.id
      ORDER BY created_at DESC
      LIMIT 5
    ) a
  ) AS recent_activities
FROM public.company_leads l
LEFT JOIN public.company_offerings o ON o.id = l.offering_id;
