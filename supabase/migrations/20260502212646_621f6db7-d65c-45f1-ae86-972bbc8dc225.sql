-- Ensure the super_admin role exists
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';