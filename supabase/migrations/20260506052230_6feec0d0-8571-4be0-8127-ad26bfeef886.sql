CREATE TABLE public.module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  stages_completed int[] NOT NULL DEFAULT '{}',
  total_stages int NOT NULL DEFAULT 6,
  progress_pct int NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, module_id)
);

CREATE INDEX module_progress_enrollment_idx ON public.module_progress(enrollment_id);
CREATE INDEX module_progress_module_idx ON public.module_progress(module_id);
CREATE INDEX module_progress_completed_idx ON public.module_progress(completed_at) WHERE completed_at IS NOT NULL;

ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Learners read their own module progress
CREATE POLICY "Learners view own module progress"
ON public.module_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = module_progress.enrollment_id
      AND (e.talent_id = auth.uid() OR e.student_id = auth.uid())
  )
);

-- Admins read all
CREATE POLICY "Admins view all module progress"
ON public.module_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE/DELETE policies — trigger-only writes (security definer functions in 2.2.b)

-- Auto-update updated_at
CREATE TRIGGER module_progress_set_updated_at
BEFORE UPDATE ON public.module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();