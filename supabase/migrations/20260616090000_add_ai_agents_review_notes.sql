-- Migration to add review_notes column to public.ai_agents table
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS review_notes text DEFAULT NULL;
