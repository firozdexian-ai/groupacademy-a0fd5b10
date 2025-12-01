-- Create instructors table
CREATE TABLE public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  expertise TEXT[], -- Array of expertise areas (e.g., 'AI', 'Product Management', 'Data Science')
  team_role TEXT NOT NULL CHECK (team_role IN ('instructor', 'speaker', 'teaching_assistant', 'coordinator')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  hourly_rate NUMERIC(10,2),
  bank_details JSONB, -- Encrypted payment info
  social_links JSONB, -- LinkedIn, website, Twitter, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create content_instructors junction table (many-to-many)
CREATE TABLE public.content_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'assistant', 'guest')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_instructors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instructors table
CREATE POLICY "Anyone can view active instructors"
  ON public.instructors
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can view all instructors"
  ON public.instructors
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert instructors"
  ON public.instructors
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update instructors"
  ON public.instructors
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete instructors"
  ON public.instructors
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for content_instructors table
CREATE POLICY "Anyone can view content instructors"
  ON public.content_instructors
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage content instructors"
  ON public.content_instructors
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_instructors_updated_at
  BEFORE UPDATE ON public.instructors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for instructor profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-profiles', 'instructor-profiles', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view instructor profile images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'instructor-profiles');

CREATE POLICY "Admins can upload instructor profile images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'instructor-profiles' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update instructor profile images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'instructor-profiles' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete instructor profile images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'instructor-profiles' AND has_role(auth.uid(), 'admin'::app_role));