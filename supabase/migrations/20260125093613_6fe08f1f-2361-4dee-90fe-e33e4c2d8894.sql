-- 1. Track Services (Mock Interview, CV Review, etc.)
CREATE TABLE IF NOT EXISTS public.service_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_slug TEXT NOT NULL, -- e.g., 'mock-interview', 'resume-review'
  source TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Track OUTGOING service shares (Team Activity)
CREATE TABLE IF NOT EXISTS public.service_share_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_slug TEXT NOT NULL,
  channel TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  shared_by UUID REFERENCES auth.users(id)
);

-- 3. Function to log service clicks
CREATE OR REPLACE FUNCTION public.track_service_click(p_slug TEXT, p_source TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO service_analytics (service_slug, source) VALUES (p_slug, p_source);
END;
$$;

-- Enable RLS
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_share_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_analytics
CREATE POLICY "Anyone can insert service analytics"
  ON public.service_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view service analytics"
  ON public.service_analytics FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for service_share_logs
CREATE POLICY "Authenticated users can insert their own share logs"
  ON public.service_share_logs FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Admins can view service share logs"
  ON public.service_share_logs FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- Performance indexes
CREATE INDEX idx_service_analytics_slug ON public.service_analytics(service_slug);
CREATE INDEX idx_service_analytics_source ON public.service_analytics(source);
CREATE INDEX idx_service_analytics_clicked_at ON public.service_analytics(clicked_at DESC);
CREATE INDEX idx_service_share_logs_slug ON public.service_share_logs(service_slug);
CREATE INDEX idx_service_share_logs_channel ON public.service_share_logs(channel);
CREATE INDEX idx_service_share_logs_shared_at ON public.service_share_logs(shared_at DESC);