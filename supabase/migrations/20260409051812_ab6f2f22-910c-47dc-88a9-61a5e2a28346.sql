
-- Fix SECURITY DEFINER view issue
DROP VIEW IF EXISTS public.instructors_public;

CREATE VIEW public.instructors_public
WITH (security_invoker = true) AS
SELECT 
  id, full_name, email, bio, expertise, team_role, 
  profile_image_url, social_links, status, created_at, updated_at
FROM public.instructors
WHERE status = 'active';
