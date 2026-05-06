-- Phase 1.4: Career Coach binding
ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS career_coach_instructor_id uuid REFERENCES public.ai_instructors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_talents_career_coach ON public.talents(career_coach_instructor_id);

CREATE OR REPLACE FUNCTION public.assign_career_coach(_talent_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cat uuid;
  _coach uuid;
BEGIN
  SELECT profession_category_id INTO _cat FROM public.talents WHERE id = _talent_id;

  IF _cat IS NOT NULL THEN
    SELECT id INTO _coach
    FROM public.ai_instructors
    WHERE profession_line_id = _cat AND is_active = true
    LIMIT 1;
  END IF;

  IF _coach IS NULL THEN
    -- Fallback: Career Coaching profession category, else any active instructor
    SELECT ai.id INTO _coach
    FROM public.ai_instructors ai
    JOIN public.profession_categories pc ON pc.id = ai.profession_line_id
    WHERE ai.is_active = true AND pc.name ILIKE 'Career Coaching'
    LIMIT 1;
  END IF;

  IF _coach IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.talents
  SET career_coach_instructor_id = _coach
  WHERE id = _talent_id;

  RETURN _coach;
END;
$$;

-- Backfill
UPDATE public.talents t
SET career_coach_instructor_id = ai.id
FROM public.ai_instructors ai
WHERE t.career_coach_instructor_id IS NULL
  AND t.profession_category_id IS NOT NULL
  AND ai.profession_line_id = t.profession_category_id
  AND ai.is_active = true;