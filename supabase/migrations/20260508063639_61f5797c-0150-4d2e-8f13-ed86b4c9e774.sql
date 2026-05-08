-- Allow a talent to SELECT their own pitches
ALTER TABLE public.agent_pitch_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talents can view their own pitches" ON public.agent_pitch_log;
CREATE POLICY "Talents can view their own pitches"
ON public.agent_pitch_log
FOR SELECT
TO authenticated
USING (
  talent_id IN (
    SELECT id FROM public.talents WHERE user_id = auth.uid()
  )
);