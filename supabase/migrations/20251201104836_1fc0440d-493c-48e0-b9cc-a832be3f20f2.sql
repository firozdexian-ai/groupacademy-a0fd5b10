-- Create atomic sequence for student ID generation
CREATE SEQUENCE IF NOT EXISTS student_id_seq START WITH 3;

-- Rewrite generate_student_id function to use atomic sequence
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.student_id := 'GA-' || LPAD(nextval('student_id_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Ensure trigger is properly attached
DROP TRIGGER IF EXISTS generate_student_id_trigger ON public.students;
CREATE TRIGGER generate_student_id_trigger
  BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.generate_student_id();