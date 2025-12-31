-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'system', 'service', 'job_match', 'course', 'credit', 'announcement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'bell',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM talents t 
      WHERE t.id = notifications.talent_id 
      AND (t.user_id = auth.uid() OR lower(t.email) = lower(auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM talents t 
      WHERE t.id = notifications.talent_id 
      AND (t.user_id = auth.uid() OR lower(t.email) = lower(auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM talents t 
      WHERE t.id = notifications.talent_id 
      AND (t.user_id = auth.uid() OR lower(t.email) = lower(auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_notifications_talent_unread 
  ON public.notifications(talent_id, is_read, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create welcome notification trigger
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (talent_id, type, title, message, icon)
  VALUES (
    NEW.id,
    'system',
    'Welcome to Growthpad! 🎉',
    'Complete your profile to get personalized job and course recommendations.',
    'sparkles'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_talent_created_notification
  AFTER INSERT ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.create_welcome_notification();