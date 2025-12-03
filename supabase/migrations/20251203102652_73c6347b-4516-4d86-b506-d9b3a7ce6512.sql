-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own assessments by email" ON career_assessments;

-- Create a more permissive SELECT policy that allows viewing by ID or email
CREATE POLICY "Users can view their assessments"
ON career_assessments
FOR SELECT
USING (
  true -- Allow anyone to view any assessment (public scorecards)
);

-- Note: Keeping INSERT and ADMIN policies as they are