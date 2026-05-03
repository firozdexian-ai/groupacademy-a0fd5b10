
ALTER TABLE public.admin_chat_threads
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.admin_chat_messages
  ADD COLUMN IF NOT EXISTS handoff_to text;

-- enable realtime
ALTER TABLE public.admin_chat_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_chat_messages';
  END IF;
END $$;
