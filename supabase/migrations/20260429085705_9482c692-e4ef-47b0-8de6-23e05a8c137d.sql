
-- =========================================================================
-- AGENT OS — Phase 1: Schema foundation
-- =========================================================================

-- Enable vector extension for KB embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- -------------------------------------------------------------------------
-- 1. Extend ai_agents with Agent OS columns
-- -------------------------------------------------------------------------
ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS owner_kind text NOT NULL DEFAULT 'platform'
    CHECK (owner_kind IN ('platform','company','talent','admin')),
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'talent'
    CHECK (audience IN ('talent','company','admin','headless','any')),
  ADD COLUMN IF NOT EXISTS agent_level int NOT NULL DEFAULT 1
    CHECK (agent_level BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS connection_fee numeric(12,1) NOT NULL DEFAULT 1.25,
  ADD COLUMN IF NOT EXISTS message_credit_cost numeric(12,1) NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS allowed_tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','unlisted','private','marketplace')),
  ADD COLUMN IF NOT EXISTS marketplace_status text NOT NULL DEFAULT 'none'
    CHECK (marketplace_status IN ('none','pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS kill_switch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_prompt_variant text NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS prompt_variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  ADD COLUMN IF NOT EXISTS builder_model text NOT NULL DEFAULT 'google/gemini-2.5-pro',
  ADD COLUMN IF NOT EXISTS canvas_mode text NOT NULL DEFAULT 'auto'
    CHECK (canvas_mode IN ('auto','always','never'));

CREATE INDEX IF NOT EXISTS idx_ai_agents_owner ON public.ai_agents(owner_kind, owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_audience ON public.ai_agents(audience) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_marketplace ON public.ai_agents(marketplace_status) WHERE marketplace_status = 'pending';

-- -------------------------------------------------------------------------
-- 2. Tool registry
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,           -- e.g. 'jobs','cv','outreach','image','search','wallet','company_ops'
  audience text[] NOT NULL DEFAULT '{talent}',
  min_level int NOT NULL DEFAULT 1 CHECK (min_level BETWEEN 1 AND 3),
  default_credit_cost numeric(12,1) NOT NULL DEFAULT 0,
  handler_kind text NOT NULL DEFAULT 'edge_function'
    CHECK (handler_kind IN ('edge_function','rpc','internal')),
  handler_ref text NOT NULL,         -- function/RPC name
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tools" ON public.agent_tools
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage tools" ON public.agent_tools
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE TRIGGER trg_agent_tools_updated BEFORE UPDATE ON public.agent_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------------------
-- 3. Threads + messages (multi-stakeholder conversation store)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  agent_key text NOT NULL,
  subject_kind text NOT NULL CHECK (subject_kind IN ('talent','company_user','admin','system')),
  subject_id uuid NOT NULL,           -- talent.id / company.id / user_roles.user_id / null-for-system
  company_id uuid,                    -- denormalized for company threads
  title text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count int NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threads_subject ON public.agent_threads(subject_kind, subject_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_company ON public.agent_threads(company_id, last_message_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_threads_agent ON public.agent_threads(agent_id);

ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all threads" ON public.agent_threads
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Talents view own threads" ON public.agent_threads
  FOR SELECT USING (
    subject_kind = 'talent' AND EXISTS (
      SELECT 1 FROM public.talents t WHERE t.id = subject_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Talents create own threads" ON public.agent_threads
  FOR INSERT WITH CHECK (
    subject_kind = 'talent' AND EXISTS (
      SELECT 1 FROM public.talents t WHERE t.id = subject_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Talents update own threads" ON public.agent_threads
  FOR UPDATE USING (
    subject_kind = 'talent' AND EXISTS (
      SELECT 1 FROM public.talents t WHERE t.id = subject_id AND t.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_threads_updated BEFORE UPDATE ON public.agent_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text,
  tool_calls jsonb,                  -- [{tool_key, args, result_artifact_id}]
  artifact_ids uuid[] DEFAULT '{}',
  tokens_in int DEFAULT 0,
  tokens_out int DEFAULT 0,
  llm_cost_usd numeric(12,6) DEFAULT 0,
  credit_cost numeric(12,1) DEFAULT 0,
  prompt_variant text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.agent_messages(thread_id, created_at);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all messages" ON public.agent_messages
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "View messages of own threads" ON public.agent_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agent_threads th
      JOIN public.talents t ON t.id = th.subject_id
      WHERE th.id = thread_id
        AND th.subject_kind = 'talent'
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert messages in own threads" ON public.agent_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_threads th
      JOIN public.talents t ON t.id = th.subject_id
      WHERE th.id = thread_id
        AND th.subject_kind = 'talent'
        AND t.user_id = auth.uid()
    )
  );

-- Artifacts (canvas items)
CREATE TABLE IF NOT EXISTS public.agent_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  kind text NOT NULL,                -- 'job_draft','shortlist','cover_letter','image','outreach','prep_sheet','contract','custom'
  title text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  storage_path text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','rejected','published','sent')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_thread ON public.agent_artifacts(thread_id, created_at DESC);

ALTER TABLE public.agent_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all artifacts" ON public.agent_artifacts
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Owners view artifacts of own threads" ON public.agent_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agent_threads th
      JOIN public.talents t ON t.id = th.subject_id
      WHERE th.id = thread_id
        AND th.subject_kind = 'talent'
        AND t.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_artifacts_updated BEFORE UPDATE ON public.agent_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------------------
-- 4. Knowledge base + chunks (vector RAG)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  source_kind text NOT NULL CHECK (source_kind IN ('file','url','text')),
  title text NOT NULL,
  source_ref text,                   -- storage path or URL
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','ingesting','ready','failed','disabled')),
  chunk_count int NOT NULL DEFAULT 0,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage KB sources" ON public.agent_knowledge_sources
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE TRIGGER trg_kb_sources_updated BEFORE UPDATE ON public.agent_knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.agent_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.agent_knowledge_sources(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(768),
  token_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_agent ON public.agent_knowledge_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding ON public.agent_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.agent_knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage KB chunks" ON public.agent_knowledge_chunks
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Vector search helper
CREATE OR REPLACE FUNCTION public.match_agent_knowledge(
  p_agent_id uuid,
  p_query_embedding vector(768),
  p_match_count int DEFAULT 5
)
RETURNS TABLE (chunk_id uuid, content text, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, content, 1 - (embedding <=> p_query_embedding) AS similarity
  FROM public.agent_knowledge_chunks
  WHERE agent_id = p_agent_id AND embedding IS NOT NULL
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

-- -------------------------------------------------------------------------
-- 5. Connections (one-time fee per subject↔agent pairing)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  subject_kind text NOT NULL CHECK (subject_kind IN ('talent','company','admin')),
  subject_id uuid NOT NULL,
  fee_paid numeric(12,1) NOT NULL DEFAULT 0,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, subject_kind, subject_id)
);

ALTER TABLE public.agent_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage connections" ON public.agent_connections
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Talents view own connections" ON public.agent_connections
  FOR SELECT USING (
    subject_kind = 'talent' AND EXISTS (
      SELECT 1 FROM public.talents t WHERE t.id = subject_id AND t.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- 6. Credit events (granular per-turn agent ledger)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_credit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.agent_threads(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  subject_kind text NOT NULL,
  subject_id uuid NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('connection','message','tool','delivery','headless','refund')),
  credits numeric(12,1) NOT NULL,
  llm_cost_usd numeric(12,6) DEFAULT 0,
  tokens_in int DEFAULT 0,
  tokens_out int DEFAULT 0,
  tool_key text,
  prompt_variant text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_events_agent ON public.agent_credit_events(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_events_subject ON public.agent_credit_events(subject_kind, subject_id, created_at DESC);

ALTER TABLE public.agent_credit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view credit events" ON public.agent_credit_events
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Subjects view own credit events" ON public.agent_credit_events
  FOR SELECT USING (
    subject_kind = 'talent' AND EXISTS (
      SELECT 1 FROM public.talents t WHERE t.id = subject_id AND t.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- 7. Platform events + agent triggers (headless event layer)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind text NOT NULL,
  subject_kind text,
  subject_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_unprocessed ON public.platform_events(event_kind, created_at) WHERE processed_at IS NULL;

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events" ON public.platform_events
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE TABLE IF NOT EXISTS public.agent_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  event_kind text NOT NULL,         -- matches platform_events.event_kind, or 'cron'
  cron_expression text,
  recipient_strategy text NOT NULL DEFAULT 'subject'
    CHECK (recipient_strategy IN ('subject','admin','company','custom')),
  recipient_filter jsonb DEFAULT '{}'::jsonb,
  template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_triggers_event ON public.agent_triggers(event_kind) WHERE is_active = true;

ALTER TABLE public.agent_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage triggers" ON public.agent_triggers
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE TRIGGER trg_triggers_updated BEFORE UPDATE ON public.agent_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------------------
-- 8. Headless pool wallet (admin-toppable platform pool)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.headless_pool (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  balance numeric(14,1) NOT NULL DEFAULT 0,
  monthly_cap numeric(14,1) NOT NULL DEFAULT 10000,
  spent_this_month numeric(14,1) NOT NULL DEFAULT 0,
  month_anchor date NOT NULL DEFAULT date_trunc('month', now())::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.headless_pool (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.headless_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage headless pool" ON public.headless_pool
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- -------------------------------------------------------------------------
-- 9. Company credits (mirror of talent_credits for B2B)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  balance numeric(12,1) NOT NULL DEFAULT 0,
  earned_balance numeric(12,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage company credits" ON public.company_credits
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE TRIGGER trg_company_credits_updated BEFORE UPDATE ON public.company_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.company_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount numeric(12,1) NOT NULL,
  balance_after numeric(12,1) NOT NULL,
  transaction_type text NOT NULL,
  service_type text,
  reference_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_txn_company ON public.company_credit_transactions(company_id, created_at DESC);

ALTER TABLE public.company_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage company txns" ON public.company_credit_transactions
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- -------------------------------------------------------------------------
-- 10. Marketplace earnings (for talent/company-built agents)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_marketplace_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  builder_kind text NOT NULL CHECK (builder_kind IN ('talent','company')),
  builder_id uuid NOT NULL,
  credit_event_id uuid REFERENCES public.agent_credit_events(id) ON DELETE SET NULL,
  gross_credits numeric(12,1) NOT NULL,
  builder_share numeric(12,1) NOT NULL,    -- 70%
  platform_share numeric(12,1) NOT NULL,   -- 30%
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_builder ON public.agent_marketplace_earnings(builder_kind, builder_id, created_at DESC);

ALTER TABLE public.agent_marketplace_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage marketplace earnings" ON public.agent_marketplace_earnings
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Builders view own earnings" ON public.agent_marketplace_earnings
  FOR SELECT USING (
    builder_kind = 'talent' AND EXISTS (
      SELECT 1 FROM public.talents t WHERE t.id = builder_id AND t.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- 11. Seed tool registry
-- -------------------------------------------------------------------------
INSERT INTO public.agent_tools (tool_key, name, description, category, audience, min_level, default_credit_cost, handler_kind, handler_ref, input_schema) VALUES
  ('score_job_match',      'Score Job Match',           'Rank how well a talent fits a specific job', 'jobs',       ARRAY['talent','company','admin'], 1, 0.5, 'edge_function', 'score-job-match',            '{"type":"object","properties":{"job_id":{"type":"string"},"talent_id":{"type":"string"}},"required":["job_id"]}'::jsonb),
  ('suggest_jobs',         'Suggest Jobs',              'Find best-fit jobs for a talent',            'jobs',       ARRAY['talent','admin'],           1, 0.5, 'edge_function', 'suggest-jobs-for-talent',    '{"type":"object","properties":{"talent_id":{"type":"string"},"limit":{"type":"integer"}}}'::jsonb),
  ('parse_cv',             'Parse CV',                  'Extract structured data from a CV file',     'cv',         ARRAY['talent','company','admin'], 1, 1.0, 'edge_function', 'parse-cv',                   '{"type":"object","properties":{"file_path":{"type":"string"}},"required":["file_path"]}'::jsonb),
  ('score_talent_match',   'Score Talent Match',        'Rank talents against a job spec',            'sourcing',   ARRAY['company','admin'],          1, 1.0, 'edge_function', 'score-talent-match',         '{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb),
  ('enhance_cover_letter', 'Enhance Cover Letter',      'Polish a draft cover letter',                'writing',    ARRAY['talent','admin'],           1, 1.0, 'edge_function', 'enhance-cover-letter',       '{"type":"object","properties":{"draft":{"type":"string"},"job_id":{"type":"string"}}}'::jsonb),
  ('enhance_job_desc',     'Enhance Job Description',   'Polish a draft JD',                          'writing',    ARRAY['company','admin'],          1, 1.0, 'edge_function', 'enhance-job-description',    '{"type":"object","properties":{"draft":{"type":"string"}},"required":["draft"]}'::jsonb),
  ('generate_outreach',    'Generate Outreach Message', 'Write a tailored outreach message',          'outreach',   ARRAY['talent','company','admin'], 1, 0.5, 'edge_function', 'generate-outreach-message',  '{"type":"object","properties":{"recipient":{"type":"string"},"goal":{"type":"string"}}}'::jsonb),
  ('analyze_salary',       'Analyze Salary',            'Generate salary benchmark analysis',         'analysis',   ARRAY['talent','admin'],           2, 2.0, 'edge_function', 'analyze-salary',             '{"type":"object","properties":{"profession":{"type":"string"}},"required":["profession"]}'::jsonb),
  ('analyze_job_market',   'Analyze Job Market',        'Market trends for a profession/region',      'analysis',   ARRAY['talent','company','admin'], 2, 2.0, 'edge_function', 'analyze-job-market',         '{"type":"object","properties":{"profession":{"type":"string"},"country":{"type":"string"}}}'::jsonb),
  ('prepare_external_app', 'Prepare External App',      'Prep talent for an off-platform application','jobs',       ARRAY['talent'],                   2, 2.0, 'edge_function', 'prepare-external-application','{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb),
  ('generate_interview_q', 'Generate Interview Qs',     'Make interview questions for a role',        'interview',  ARRAY['talent','company','admin'], 1, 1.0, 'edge_function', 'generate-interview-questions','{"type":"object","properties":{"role":{"type":"string"}},"required":["role"]}'::jsonb),
  ('analyze_interview',    'Analyze Mock Interview',    'Score a mock interview transcript',          'interview',  ARRAY['talent','admin'],           2, 2.0, 'edge_function', 'analyze-mock-interview',     '{"type":"object","properties":{"transcript_id":{"type":"string"}},"required":["transcript_id"]}'::jsonb),
  ('generate_image',       'Generate Image',            'Create an image (banners, avatars)',         'image',      ARRAY['talent','company','admin'], 1, 2.0, 'internal',      'image_gen',                  '{"type":"object","properties":{"prompt":{"type":"string"}},"required":["prompt"]}'::jsonb),
  ('generate_share_caption','Generate Share Caption',   'Make a social-share caption for a job',      'outreach',   ARRAY['talent','company','admin'], 1, 0.5, 'edge_function', 'generate-job-share-caption', '{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb),
  ('lead_hunt_match',      'Lead Hunt Match',           'Match leads to opportunities',               'sourcing',   ARRAY['company','admin'],          2, 1.0, 'edge_function', 'lead-hunt-match',            '{"type":"object","properties":{"criteria":{"type":"object"}}}'::jsonb),
  ('top_up_credits',       'Top Up Credits',            'Open a WhatsApp invoice for credit purchase','wallet',     ARRAY['talent','company'],         1, 0,   'rpc',           'create_credit_invoice',      '{"type":"object","properties":{"bundle_credits":{"type":"integer"},"bundle_price_usd":{"type":"number"}}}'::jsonb),
  ('publish_job',          'Publish Job',               'Insert a job from approved canvas draft',    'company_ops',ARRAY['company','admin'],          1, 1.0, 'internal',      'publish_job_artifact',       '{"type":"object","properties":{"artifact_id":{"type":"string"}},"required":["artifact_id"]}'::jsonb),
  ('shortlist_talent',     'Shortlist Talent',          'Add a talent to a job shortlist',            'company_ops',ARRAY['company','admin'],          1, 0.5, 'internal',      'shortlist_talent',           '{"type":"object","properties":{"job_id":{"type":"string"},"talent_id":{"type":"string"}},"required":["job_id","talent_id"]}'::jsonb),
  ('search_kb',            'Search Knowledge Base',     'Semantic search the agent KB',               'search',     ARRAY['talent','company','admin'], 1, 0,   'rpc',           'match_agent_knowledge',      '{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}'::jsonb)
ON CONFLICT (tool_key) DO NOTHING;
