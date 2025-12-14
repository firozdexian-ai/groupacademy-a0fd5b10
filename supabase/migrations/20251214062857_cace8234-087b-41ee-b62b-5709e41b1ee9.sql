-- Create helper function to check if user has any admin-level role
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'talent_exec')
  )
$$;

-- Update RLS policies for professionals table to allow talent_exec read access
DROP POLICY IF EXISTS "Talent exec can view all professionals" ON public.professionals;
CREATE POLICY "Talent exec can view all professionals"
ON public.professionals
FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Update RLS policies for portfolio_requests to allow talent_exec access
DROP POLICY IF EXISTS "Talent exec can view all portfolio requests" ON public.portfolio_requests;
CREATE POLICY "Talent exec can view all portfolio requests"
ON public.portfolio_requests
FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

DROP POLICY IF EXISTS "Talent exec can insert portfolio requests" ON public.portfolio_requests;
CREATE POLICY "Talent exec can insert portfolio requests"
ON public.portfolio_requests
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

DROP POLICY IF EXISTS "Talent exec can update portfolio requests" ON public.portfolio_requests;
CREATE POLICY "Talent exec can update portfolio requests"
ON public.portfolio_requests
FOR UPDATE
USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Allow talent_exec to view profession_categories for dropdowns
DROP POLICY IF EXISTS "Talent exec can view profession categories" ON public.profession_categories;
CREATE POLICY "Talent exec can view profession categories"
ON public.profession_categories
FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));