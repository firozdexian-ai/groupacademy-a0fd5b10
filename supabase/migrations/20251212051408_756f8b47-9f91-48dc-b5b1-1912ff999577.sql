-- Fix RLS policies that reference auth.users table directly
-- Use auth.jwt() claims instead which is more reliable

-- Fix portfolio_requests policy
DROP POLICY IF EXISTS "Users can view own requests by email match" ON public.portfolio_requests;
CREATE POLICY "Users can view own requests by email match"
ON public.portfolio_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR email = (auth.jwt() ->> 'email')
);

-- Fix job_applications policies
DROP POLICY IF EXISTS "Users can insert own applications" ON public.job_applications;
CREATE POLICY "Users can insert own applications"
ON public.job_applications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_applications.professional_id
    AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
  )
);

DROP POLICY IF EXISTS "Users can view own applications" ON public.job_applications;
CREATE POLICY "Users can view own applications"
ON public.job_applications FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_applications.professional_id
    AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix job_application_usage policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.job_application_usage;
CREATE POLICY "Users can view own usage"
ON public.job_application_usage FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_application_usage.professional_id
    AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can insert own usage" ON public.job_application_usage;
CREATE POLICY "Users can insert own usage"
ON public.job_application_usage FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_application_usage.professional_id
    AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
  )
);

DROP POLICY IF EXISTS "Users can update own usage" ON public.job_application_usage;
CREATE POLICY "Users can update own usage"
ON public.job_application_usage FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_application_usage.professional_id
    AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
  )
);

-- Fix professionals policy for own profile viewing
DROP POLICY IF EXISTS "Users can view own professional profile" ON public.professionals;
CREATE POLICY "Users can view own professional profile"
ON public.professionals FOR SELECT
USING (
  auth.uid() = user_id 
  OR email = (auth.jwt() ->> 'email')
  OR is_featured = true
  OR has_role(auth.uid(), 'admin'::app_role)
);