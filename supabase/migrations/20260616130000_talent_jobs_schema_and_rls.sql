-- 1. Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_jobs_is_active_created_at ON public.jobs(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_profession_category_id ON public.jobs(profession_category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON public.jobs(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id_status ON public.job_applications(job_id, application_status);

-- 2. Add search generated column and search index
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(company_name,'') || ' ' || coalesce(description,''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_search_tsv ON public.jobs USING gin(search_tsv);

-- 3. Add application_answers column to job_applications
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS application_answers jsonb DEFAULT '{}'::jsonb;

-- 4. Create trigger to protect job_applications column modifications and state transitions
CREATE OR REPLACE FUNCTION public.check_job_application_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user updating is an admin, allow everything
  IF public.has_any_admin_role(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- If the user is a recruiter for the company, allow updates
  IF EXISTS (
    SELECT 1 FROM public.company_members cm
    JOIN public.jobs j ON j.id = OLD.job_id
    WHERE cm.user_id = auth.uid() AND cm.company_id = j.company_id
  ) THEN
    RETURN NEW;
  END IF;

  -- Otherwise, it's a talent (candidate).
  -- They can ONLY update their own application, and only specific fields: application_status (to 'withdrawn' or 'submitted') and withdrawn_at.
  -- All other fields MUST remain unchanged!
  IF NEW.talent_id IS DISTINCT FROM OLD.talent_id OR
     NEW.job_id IS DISTINCT FROM OLD.job_id OR
     NEW.cover_letter IS DISTINCT FROM OLD.cover_letter OR
     NEW.cv_url IS DISTINCT FROM OLD.cv_url OR
     NEW.ai_match_score IS DISTINCT FROM OLD.ai_match_score OR
     NEW.ai_match_rationale IS DISTINCT FROM OLD.ai_match_rationale OR
     NEW.delivery_status IS DISTINCT FROM OLD.delivery_status OR
     NEW.application_answers IS DISTINCT FROM OLD.application_answers
  THEN
    RAISE EXCEPTION 'Candidates can only update the application status to withdrawn or submitted.';
  END IF;

  -- Enforce that the status transition can only be to 'withdrawn' or 'submitted'
  IF NEW.application_status NOT IN ('withdrawn', 'submitted') THEN
    RAISE EXCEPTION 'Candidates can only withdraw or re-submit their application.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_job_application_update_trigger ON public.job_applications;
CREATE TRIGGER check_job_application_update_trigger
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.check_job_application_update();

-- 5. Grant execute on the verification trigger function to authenticated role
GRANT EXECUTE ON FUNCTION public.check_job_application_update() TO authenticated;

-- 6. Harden update policy on job_applications for talent (defense in depth)
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
