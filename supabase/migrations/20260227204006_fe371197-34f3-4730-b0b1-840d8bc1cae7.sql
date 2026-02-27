ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb;