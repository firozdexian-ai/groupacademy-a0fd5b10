
-- 1. Fix instructors table: restrict public SELECT to non-sensitive columns via a view
-- Drop the existing overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active instructors public info" ON public.instructors;

-- Create a restricted public SELECT policy (still allows reading, but we'll use a view for the app)
-- We need a view approach: create a view that excludes sensitive cols
CREATE OR REPLACE VIEW public.instructors_public AS
SELECT 
  id, full_name, email, bio, expertise, team_role, 
  profile_image_url, social_links, status, created_at, updated_at
FROM public.instructors
WHERE status = 'active';

-- Re-create a more restrictive public policy: only allow reading non-sensitive columns
-- Since Postgres doesn't support column-level RLS, use GRANT to revoke column access
-- Better approach: keep the policy but revoke column-level grants
-- Actually, the cleanest approach is to just restrict public to use the view, and require auth for the table

-- Create new policy: authenticated users can view active instructors (without bank_details, handled by app)
CREATE POLICY "Authenticated users can view active instructors"
ON public.instructors
FOR SELECT
TO authenticated
USING (status = 'active');

-- Admin-only policy for full access including bank_details
CREATE POLICY "Admins can view all instructor data"
ON public.instructors
FOR SELECT
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- 2. Fix professionals UPDATE policy
DROP POLICY IF EXISTS "Users can update own professional profile" ON public.professionals;

CREATE POLICY "Users can update own professional profile"
ON public.professionals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Fix talent-cvs storage: make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'talent-cvs';

-- Remove the public read policy
DROP POLICY IF EXISTS "Public can read talent CVs" ON storage.objects;

-- Add owner-scoped read policy (talent can read their own CVs)
CREATE POLICY "Talent can read own CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'talent-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin can read all CVs
CREATE POLICY "Admins can read all CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'talent-cvs'
  AND public.has_any_admin_role(auth.uid())
);
