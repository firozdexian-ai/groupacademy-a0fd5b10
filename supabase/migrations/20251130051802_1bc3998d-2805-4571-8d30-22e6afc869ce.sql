-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policy for user_roles: users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy for user_roles: admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Update students table RLS policies
DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;

CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all students"
ON public.students
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update enrollments table RLS policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can insert own enrollments" ON public.enrollments;

CREATE POLICY "Students can view own enrollments"
ON public.enrollments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.students
  WHERE students.id = enrollments.student_id
  AND students.user_id = auth.uid()
));

CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert own enrollments"
ON public.enrollments
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students
  WHERE students.id = enrollments.student_id
  AND students.user_id = auth.uid()
));

CREATE POLICY "Admins can insert enrollments"
ON public.enrollments
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update enrollments"
ON public.enrollments
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete enrollments"
ON public.enrollments
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update content table RLS policies for admin management
CREATE POLICY "Admins can insert content"
ON public.content
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content"
ON public.content
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content"
ON public.content
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));