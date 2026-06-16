-- 1. Grant execute on the verification trigger function to authenticated role
GRANT EXECUTE ON FUNCTION public.check_job_application_update() TO authenticated;

-- 2. Harden update policy on job_applications for talent (defense in depth)
DROP POLICY IF EXISTS "Users can update own applications" ON public.job_applications;

CREATE POLICY "Users can update own applications" 
ON public.job_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.talents
    WHERE talents.id = talent_id
    AND talents.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Ensure talent_id matches the user's talent record
  talent_id = (SELECT id FROM public.talents WHERE user_id = auth.uid())
  -- Only allow status to be updated to 'withdrawn' or 'submitted'
  AND application_status IN ('withdrawn', 'submitted')
);
