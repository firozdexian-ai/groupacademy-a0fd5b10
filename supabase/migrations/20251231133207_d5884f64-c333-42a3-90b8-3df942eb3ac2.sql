-- =============================================
-- PHASE B: Create tables for Coming Soon features
-- =============================================

-- 1. Study Abroad Programs
CREATE TABLE public.study_abroad_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  degree_type TEXT, -- Bachelor, Master, PhD
  field_of_study TEXT,
  duration TEXT,
  tuition_range TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  application_deadline DATE,
  intake_months TEXT[],
  scholarship_available BOOLEAN DEFAULT false,
  url TEXT,
  featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_abroad_programs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active study abroad programs"
  ON public.study_abroad_programs FOR SELECT
  USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage study abroad programs"
  ON public.study_abroad_programs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. IELTS Resources
CREATE TABLE public.ielts_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('listening', 'reading', 'writing', 'speaking', 'general')),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'practice', 'mock_test', 'tips')),
  content_url TEXT,
  content_data JSONB,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_mins INTEGER,
  is_free BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ielts_resources ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active IELTS resources"
  ON public.ielts_resources FOR SELECT
  USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage IELTS resources"
  ON public.ielts_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Competitions
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  rules TEXT,
  prizes JSONB DEFAULT '[]'::jsonb,
  start_date DATE,
  end_date DATE,
  submission_deadline TIMESTAMPTZ,
  category TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'judging', 'completed', 'cancelled')),
  featured_image TEXT,
  max_participants INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view competitions"
  ON public.competitions FOR SELECT
  USING (true);

-- Admin management
CREATE POLICY "Admins can manage competitions"
  ON public.competitions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Competition Submissions
CREATE TABLE public.competition_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_data JSONB,
  description TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  score INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'winner', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, talent_id)
);

-- Enable RLS
ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view own submissions
CREATE POLICY "Users can view own competition submissions"
  ON public.competition_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM talents t
      WHERE t.id = competition_submissions.talent_id
      AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
    )
  );

-- Users can create own submissions
CREATE POLICY "Users can create own competition submissions"
  ON public.competition_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM talents t
      WHERE t.id = competition_submissions.talent_id
      AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
    )
  );

-- Users can update own submissions
CREATE POLICY "Users can update own competition submissions"
  ON public.competition_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM talents t
      WHERE t.id = competition_submissions.talent_id
      AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
    )
  );

-- Admin management
CREATE POLICY "Admins can manage all competition submissions"
  ON public.competition_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Blog Posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  author_name TEXT,
  author_id UUID REFERENCES public.instructors(id),
  category TEXT,
  tags TEXT[],
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views INTEGER DEFAULT 0,
  reading_time_mins INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role));

-- Admin management
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_study_abroad_programs_updated_at
  BEFORE UPDATE ON public.study_abroad_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ielts_resources_updated_at
  BEFORE UPDATE ON public.ielts_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competition_submissions_updated_at
  BEFORE UPDATE ON public.competition_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();