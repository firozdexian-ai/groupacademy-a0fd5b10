
ALTER TABLE public.ai_job_recommendations
  ADD COLUMN IF NOT EXISTS match_reason text,
  ADD COLUMN IF NOT EXISTS verified_match jsonb;

CREATE INDEX IF NOT EXISTS idx_ai_job_recs_reason
  ON public.ai_job_recommendations(talent_id, match_reason);
