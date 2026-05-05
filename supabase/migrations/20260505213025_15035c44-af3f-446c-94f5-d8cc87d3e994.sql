ALTER TABLE public.content ADD COLUMN IF NOT EXISTS event_timezone text NOT NULL DEFAULT 'Asia/Dhaka';

CREATE OR REPLACE FUNCTION public.auto_ready_live_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.content_type IN ('live_webinar','batch_class','offline_seminar')
     AND COALESCE(NEW.is_published, false) = true
     AND NEW.event_date IS NOT NULL THEN
    NEW.is_ready := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_ready_live ON public.content;
CREATE TRIGGER trg_auto_ready_live
BEFORE INSERT OR UPDATE ON public.content
FOR EACH ROW EXECUTE FUNCTION public.auto_ready_live_events();

UPDATE public.content
   SET is_ready = true,
       event_date = '2026-05-08 16:00:00+00',
       event_timezone = 'Asia/Dhaka'
 WHERE slug = 'the-ai-powered-professional-10x-your-productivity-with-agentic-ai';

UPDATE public.content
   SET is_ready = true
 WHERE content_type IN ('live_webinar','batch_class','offline_seminar')
   AND is_published = true
   AND event_date IS NOT NULL
   AND COALESCE(is_ready, false) = false;