-- 1. Create Recruiter RLS Policies for jobs
DROP POLICY IF EXISTS "Recruiters can view company jobs" ON public.jobs;
CREATE POLICY "Recruiters can view company jobs" ON public.jobs FOR SELECT
USING (
  public.is_company_member(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Recruiters can insert company jobs" ON public.jobs;
CREATE POLICY "Recruiters can insert company jobs" ON public.jobs FOR INSERT
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Recruiters can update company jobs" ON public.jobs;
CREATE POLICY "Recruiters can update company jobs" ON public.jobs FOR UPDATE
USING (
  public.is_company_member(auth.uid(), company_id)
)
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Recruiters can delete company jobs" ON public.jobs;
CREATE POLICY "Recruiters can delete company jobs" ON public.jobs FOR DELETE
USING (
  public.is_company_member(auth.uid(), company_id)
);


-- 2. Fix SELECT and UPDATE RLS Policies on job_invitations (aligning talent_id with talents.id)
DROP POLICY IF EXISTS "inv_select" ON public.job_invitations;
CREATE POLICY "inv_select" ON public.job_invitations FOR SELECT
USING (
  public.is_company_member(auth.uid(), company_id)
  OR EXISTS (SELECT 1 FROM public.talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
  OR public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "inv_update" ON public.job_invitations;
CREATE POLICY "inv_update" ON public.job_invitations FOR UPDATE
USING (
  public.is_company_member(auth.uid(), company_id)
  OR EXISTS (SELECT 1 FROM public.talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
  OR public.has_any_admin_role(auth.uid())
);


-- 3. Add Unique Index/Constraint on job_invitations (job_id, talent_id) for duplicate guard
ALTER TABLE public.job_invitations DROP CONSTRAINT IF EXISTS job_invitations_job_id_talent_id_key;
DROP INDEX IF EXISTS idx_job_invitations_unique_active;
CREATE UNIQUE INDEX idx_job_invitations_unique_active ON public.job_invitations (job_id, talent_id);


-- 4. Create get_company_engaged_talents RPC function
CREATE OR REPLACE FUNCTION public.get_company_engaged_talents(
  p_company_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  talent_id uuid,
  user_id uuid,
  full_name text,
  profession text,
  photo text,
  public_handle text,
  source text,
  last_at timestamptz,
  job_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify auth user is member of company or admin
  IF NOT public.is_company_member(auth.uid(), p_company_id) AND NOT public.has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: You are not a member of this company.';
  END IF;

  RETURN QUERY
  WITH engaged AS (
    -- Applicants on this company's jobs
    SELECT 
      ja.talent_id,
      'applicant'::text AS source,
      ja.created_at AS last_at,
      j.title::text AS job_title
    FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE j.company_id = p_company_id

    UNION ALL

    -- Shortlisted talents for this company
    SELECT 
      cs.talent_id,
      'shortlist'::text AS source,
      cs.created_at AS last_at,
      NULL::text AS job_title
    FROM public.company_talent_shortlists cs
    WHERE cs.company_id = p_company_id
  ),
  distinct_engaged AS (
    SELECT DISTINCT ON (e.talent_id)
      e.talent_id,
      e.source,
      e.last_at,
      e.job_title
    FROM engaged e
    ORDER BY e.talent_id, e.last_at DESC
  )
  SELECT 
    de.talent_id,
    t.user_id,
    t.full_name::text,
    t.custom_profession::text AS profession,
    t.profile_photo_url::text AS photo,
    t.public_handle::text AS public_handle,
    de.source,
    de.last_at,
    de.job_title
  FROM distinct_engaged de
  JOIN public.talents t ON t.id = de.talent_id
  ORDER BY de.last_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
