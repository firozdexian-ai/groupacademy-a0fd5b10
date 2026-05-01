
-- ============================================================
-- Phase 11H — Messenger Inbox + Agent Reviews
-- ============================================================

-- 1) message_threads ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  thread_type text NOT NULL CHECK (thread_type IN ('agent','system')),
  agent_key text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  last_message_sender text, -- 'agent' | 'user' | 'system'
  unread_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS message_threads_talent_agent_uniq
  ON public.message_threads(talent_id, agent_key)
  WHERE thread_type = 'agent';

CREATE UNIQUE INDEX IF NOT EXISTS message_threads_talent_system_uniq
  ON public.message_threads(talent_id)
  WHERE thread_type = 'system';

CREATE INDEX IF NOT EXISTS message_threads_talent_last_idx
  ON public.message_threads(talent_id, last_message_at DESC);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talents read own threads" ON public.message_threads;
CREATE POLICY "Talents read own threads"
  ON public.message_threads FOR SELECT
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents update own threads" ON public.message_threads;
CREATE POLICY "Talents update own threads"
  ON public.message_threads FOR UPDATE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents insert own threads" ON public.message_threads;
CREATE POLICY "Talents insert own threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents delete own threads" ON public.message_threads;
CREATE POLICY "Talents delete own threads"
  ON public.message_threads FOR DELETE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_message_threads_updated_at ON public.message_threads;
CREATE TRIGGER trg_message_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) agent_reviews -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_key, talent_id)
);

CREATE INDEX IF NOT EXISTS agent_reviews_agent_idx ON public.agent_reviews(agent_key);

ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews readable by authenticated" ON public.agent_reviews;
CREATE POLICY "Reviews readable by authenticated"
  ON public.agent_reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Talents insert own reviews" ON public.agent_reviews;
CREATE POLICY "Talents insert own reviews"
  ON public.agent_reviews FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents update own reviews" ON public.agent_reviews;
CREATE POLICY "Talents update own reviews"
  ON public.agent_reviews FOR UPDATE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents delete own reviews" ON public.agent_reviews;
CREATE POLICY "Talents delete own reviews"
  ON public.agent_reviews FOR DELETE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_agent_reviews_updated_at ON public.agent_reviews;
CREATE TRIGGER trg_agent_reviews_updated_at
  BEFORE UPDATE ON public.agent_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Augment notifications + agent_chat_sessions -----------------------------
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS thread_id uuid;
ALTER TABLE public.agent_chat_sessions ADD COLUMN IF NOT EXISTS thread_id uuid;

CREATE INDEX IF NOT EXISTS notifications_thread_idx ON public.notifications(thread_id);
CREATE INDEX IF NOT EXISTS agent_chat_sessions_thread_idx ON public.agent_chat_sessions(thread_id);

-- 4) Helpers -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_system_thread(_talent_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  SELECT id INTO _id
    FROM public.message_threads
   WHERE talent_id = _talent_id AND thread_type = 'system'
   LIMIT 1;

  IF _id IS NULL THEN
    INSERT INTO public.message_threads (talent_id, thread_type, agent_key, is_pinned, last_message_preview)
    VALUES (_talent_id, 'system', 'ai-general', true, 'Welcome to GroUp Academy')
    RETURNING id INTO _id;
  END IF;

  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_agent_thread(_talent_id uuid, _agent_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  SELECT id INTO _id
    FROM public.message_threads
   WHERE talent_id = _talent_id AND thread_type = 'agent' AND agent_key = _agent_key
   LIMIT 1;

  IF _id IS NULL THEN
    INSERT INTO public.message_threads (talent_id, thread_type, agent_key)
    VALUES (_talent_id, 'agent', _agent_key)
    RETURNING id INTO _id;
  END IF;

  RETURN _id;
END;
$$;

-- 5) Trigger: route notifications into system thread -------------------------
CREATE OR REPLACE FUNCTION public.notification_to_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _thread_id uuid;
BEGIN
  IF NEW.talent_id IS NULL THEN
    RETURN NEW;
  END IF;

  _thread_id := public.ensure_system_thread(NEW.talent_id);
  NEW.thread_id := _thread_id;

  UPDATE public.message_threads
     SET last_message_at = COALESCE(NEW.created_at, now()),
         last_message_preview = LEFT(COALESCE(NEW.title || ' — ' || NEW.message, NEW.message, NEW.title, ''), 200),
         last_message_sender = 'system',
         unread_count = unread_count + CASE WHEN COALESCE(NEW.is_read, false) THEN 0 ELSE 1 END,
         updated_at = now()
   WHERE id = _thread_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_to_thread ON public.notifications;
CREATE TRIGGER trg_notification_to_thread
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notification_to_thread();

-- 6) Trigger: sync agent_chat_sessions -> thread -----------------------------
CREATE OR REPLACE FUNCTION public.agent_session_to_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _thread_id uuid;
  _last jsonb;
  _preview text;
  _sender text;
  _talent_id uuid;
BEGIN
  _talent_id := NEW.talent_id;
  IF _talent_id IS NULL OR NEW.agent_key IS NULL THEN
    RETURN NEW;
  END IF;

  _thread_id := public.ensure_agent_thread(_talent_id, NEW.agent_key);
  NEW.thread_id := _thread_id;

  -- last message extraction
  IF NEW.messages IS NOT NULL AND jsonb_typeof(NEW.messages) = 'array' AND jsonb_array_length(NEW.messages) > 0 THEN
    _last := NEW.messages -> (jsonb_array_length(NEW.messages) - 1);
    _preview := LEFT(COALESCE(_last->>'content',''), 200);
    _sender := COALESCE(_last->>'role','agent');
  ELSE
    _preview := 'Conversation started';
    _sender := 'system';
  END IF;

  UPDATE public.message_threads
     SET last_message_at = now(),
         last_message_preview = _preview,
         last_message_sender = _sender,
         unread_count = CASE WHEN _sender = 'assistant' THEN unread_count + 1 ELSE unread_count END,
         updated_at = now()
   WHERE id = _thread_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_session_to_thread ON public.agent_chat_sessions;
CREATE TRIGGER trg_agent_session_to_thread
  BEFORE INSERT OR UPDATE OF messages ON public.agent_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.agent_session_to_thread();

-- 7) View: ai_agents_with_stats ---------------------------------------------
DROP VIEW IF EXISTS public.ai_agents_with_stats;
CREATE VIEW public.ai_agents_with_stats
WITH (security_invoker = true)
AS
SELECT
  a.*,
  COALESCE(s.total_users, 0)    AS total_users,
  COALESCE(s.total_messages, 0) AS total_messages,
  COALESCE(r.avg_rating, 0)     AS avg_rating,
  COALESCE(r.review_count, 0)   AS review_count
FROM public.ai_agents a
LEFT JOIN (
  SELECT agent_key,
         COUNT(DISTINCT talent_id) AS total_users,
         COALESCE(SUM(jsonb_array_length(messages)), 0) AS total_messages
    FROM public.agent_chat_sessions
   WHERE messages IS NOT NULL
   GROUP BY agent_key
) s ON s.agent_key = a.agent_key
LEFT JOIN (
  SELECT agent_key,
         AVG(rating)::numeric(3,2) AS avg_rating,
         COUNT(*) AS review_count
    FROM public.agent_reviews
   GROUP BY agent_key
) r ON r.agent_key = a.agent_key;
