-- Add talent_exec to app_role enum (separate migration)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'talent_exec';