-- 1. Table to track INCOMING clicks (Analytics)
CREATE TABLE IF NOT EXISTS public.job_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Table to track OUTGOING shares (Your Team's Progress)
CREATE TABLE IF NOT EXISTS public.job_share_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  shared_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.job_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_share_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_analytics (public insert for tracking, admin read)
CREATE POLICY "Anyone can insert job analytics" ON public.job_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view job analytics" ON public.job_analytics
  FOR SELECT USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for job_share_logs (authenticated insert, admin read)
CREATE POLICY "Authenticated users can log shares" ON public.job_share_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Admins can view share logs" ON public.job_share_logs
  FOR SELECT USING (public.has_any_admin_role(auth.uid()));

-- 3. Function to log a click (for the landing page)
CREATE OR REPLACE FUNCTION public.track_job_click(p_job_id UUID, p_source TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO job_analytics (job_id, source)
  VALUES (p_job_id, p_source);
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_job_analytics_job_id ON public.job_analytics(job_id);
CREATE INDEX idx_job_analytics_source ON public.job_analytics(source);
CREATE INDEX idx_job_analytics_clicked_at ON public.job_analytics(clicked_at);
CREATE INDEX idx_job_share_logs_job_id ON public.job_share_logs(job_id);
CREATE INDEX idx_job_share_logs_channel ON public.job_share_logs(channel);
CREATE INDEX idx_job_share_logs_shared_by ON public.job_share_logs(shared_by);