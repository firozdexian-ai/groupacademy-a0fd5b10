-- Talent-scoped RLS for enrollments
CREATE POLICY "Talents can view own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talents t
                 WHERE t.id = enrollments.talent_id
                   AND t.user_id = auth.uid()));

CREATE POLICY "Talents can insert own enrollments"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.talents t
                      WHERE t.id = enrollments.talent_id
                        AND t.user_id = auth.uid()));

CREATE POLICY "Talents can update own enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.talents t
                 WHERE t.id = enrollments.talent_id
                   AND t.user_id = auth.uid()));

-- Atomic enrollment counter for capacity tracking
CREATE OR REPLACE FUNCTION public.increment_content_enrollment(p_content_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new integer;
BEGIN
  UPDATE public.content
     SET current_enrollment = COALESCE(current_enrollment, 0) + 1
   WHERE id = p_content_id
   RETURNING current_enrollment INTO v_new;
  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_content_enrollment(uuid) TO authenticated;