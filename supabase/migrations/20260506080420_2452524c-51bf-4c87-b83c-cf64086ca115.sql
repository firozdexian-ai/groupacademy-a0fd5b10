-- Authoring feedback loop (Phase 3.6)

CREATE TABLE IF NOT EXISTS public.authoring_digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid,
  instructor_id uuid,
  recipient_email text,
  module_ids uuid[] NOT NULL DEFAULT '{}',
  items_flagged integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  sent_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.authoring_digest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read digest log" ON public.authoring_digest_log;
CREATE POLICY "Admins read digest log" ON public.authoring_digest_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins write digest log" ON public.authoring_digest_log;
CREATE POLICY "Admins write digest log" ON public.authoring_digest_log
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_authoring_digest_log_content
  ON public.authoring_digest_log(content_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_authoring_digest_log_instructor
  ON public.authoring_digest_log(instructor_id, sent_at DESC);

-- Aggregation RPC: returns per-module flagged-item summary using same flag rules as instructor-item-analytics
CREATE OR REPLACE FUNCTION public.get_authoring_review_digest(
  _module_id uuid,
  _days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module record;
  _content record;
  _since timestamptz := now() - (GREATEST(LEAST(COALESCE(_days, 30), 90), 1) || ' days')::interval;
  _stale_cutoff timestamptz := now() - interval '14 days';
  _quiz jsonb;
  _scenarios jsonb;
  _topics jsonb;
  _summary jsonb;
  _instructor record;
BEGIN
  SELECT m.id, m.title, m.content_id INTO _module
  FROM public.course_modules m WHERE m.id = _module_id;
  IF _module.id IS NULL THEN
    RETURN jsonb_build_object('error', 'module_not_found');
  END IF;

  SELECT c.id, c.title, c.is_published INTO _content
  FROM public.content c WHERE c.id = _module.content_id;

  SELECT i.id, i.full_name, i.email
  INTO _instructor
  FROM public.content_instructors ci
  JOIN public.instructors i ON i.id = ci.instructor_id
  WHERE ci.content_id = _module.content_id AND ci.role = 'primary'
  ORDER BY ci.created_at ASC
  LIMIT 1;

  -- Quiz items with attempt aggregation in window
  WITH attempts AS (
    SELECT a.item_ids, a.answers
    FROM public.talent_quiz_attempt a
    WHERE a.module_id = _module_id AND a.created_at >= _since
  ),
  quiz_serves AS (
    SELECT iid AS item_id, idx, ans
    FROM attempts a,
         LATERAL unnest(a.item_ids) WITH ORDINALITY AS u(iid, idx)
         LEFT JOIN LATERAL (
           SELECT (a.answers -> (idx - 1)::int) AS ans
         ) ax ON true
  ),
  pool AS (
    SELECT q.id, q.question, q.options, q.correct_index, q.difficulty,
           q.topic_tags, q.times_served, q.times_correct, q.created_at
    FROM public.module_quiz_pool q
    WHERE q.module_id = _module_id
  ),
  win_stats AS (
    SELECT s.item_id,
           count(*) AS w_served,
           count(*) FILTER (
             WHERE p.correct_index IS NOT NULL
               AND COALESCE(
                 (s.ans ->> 'selected_index')::int,
                 (s.ans ->> 'selected')::int,
                 CASE WHEN jsonb_typeof(s.ans) = 'number'
                      THEN (s.ans #>> '{}')::int END
               ) = p.correct_index
           ) AS w_correct
    FROM quiz_serves s
    JOIN pool p ON p.id = s.item_id
    GROUP BY s.item_id
  ),
  quiz_rows AS (
    SELECT
      p.id, p.question, p.topic_tags, p.difficulty,
      p.times_served AS serves_lifetime,
      p.times_correct AS correct_lifetime,
      CASE WHEN p.times_served > 0
           THEN p.times_correct::numeric / p.times_served::numeric
           ELSE NULL END AS p_value,
      COALESCE(w.w_served, 0) AS serves_window,
      CASE WHEN COALESCE(w.w_served, 0) > 0
           THEN w.w_correct::numeric / w.w_served::numeric
           ELSE NULL END AS p_value_window,
      (
        CASE WHEN p.times_served >= 3
             AND p.times_correct::numeric / NULLIF(p.times_served, 0) < 0.25
             THEN ARRAY['low_p_value'] ELSE ARRAY[]::text[] END ||
        CASE WHEN p.times_served >= 5
             AND p.times_correct::numeric / NULLIF(p.times_served, 0) > 0.95
             THEN ARRAY['trivial'] ELSE ARRAY[]::text[] END ||
        CASE WHEN p.times_served < 3 AND p.created_at < _stale_cutoff
             THEN ARRAY['stale'] ELSE ARRAY[]::text[] END ||
        CASE WHEN p.difficulty = 'easy' AND p.times_served > 0
             AND p.times_correct::numeric / p.times_served < 0.4
             THEN ARRAY['miscalibrated'] ELSE ARRAY[]::text[] END ||
        CASE WHEN p.difficulty = 'hard' AND p.times_served > 0
             AND p.times_correct::numeric / p.times_served > 0.85
             THEN ARRAY['miscalibrated'] ELSE ARRAY[]::text[] END
      ) AS needs_review
    FROM pool p
    LEFT JOIN win_stats w ON w.item_id = p.id
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(qr) ORDER BY (qr.p_value IS NULL), qr.p_value ASC), '[]'::jsonb)
  INTO _quiz
  FROM quiz_rows qr;

  -- Scenario items with run aggregation
  WITH spool AS (
    SELECT s.id, s.title, s.topic_tags, s.difficulty,
           s.times_served, s.created_at
    FROM public.module_scenario_pool s
    WHERE s.module_id = _module_id
  ),
  runs AS (
    SELECT r.scenario_id,
           count(*) AS run_count,
           avg( COALESCE((r.evaluation->>'overall_score')::numeric, 0) ) AS avg_overall
    FROM public.talent_scenario_run r
    WHERE r.created_at >= _since
      AND r.scenario_id IN (SELECT id FROM spool)
    GROUP BY r.scenario_id
  ),
  scenario_rows AS (
    SELECT
      s.id, s.title, s.topic_tags, s.difficulty,
      s.times_served AS runs_lifetime,
      COALESCE(r.run_count, 0) AS runs_window,
      r.avg_overall,
      (
        CASE WHEN COALESCE(r.run_count, 0) >= 3 AND COALESCE(r.avg_overall, 1) < 0.3
             THEN ARRAY['low_rubric'] ELSE ARRAY[]::text[] END ||
        CASE WHEN s.times_served < 1 AND s.created_at < _stale_cutoff
             THEN ARRAY['stale'] ELSE ARRAY[]::text[] END
      ) AS needs_review
    FROM spool s
    LEFT JOIN runs r ON r.scenario_id = s.id
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(sr) ORDER BY (sr.avg_overall IS NULL), sr.avg_overall ASC), '[]'::jsonb)
  INTO _scenarios
  FROM scenario_rows sr;

  -- Topic rollup
  WITH all_tags AS (
    SELECT topic_tag
    FROM (
      SELECT unnest(q.topic_tags) AS topic_tag FROM public.module_quiz_pool q WHERE q.module_id = _module_id
      UNION ALL
      SELECT unnest(s.topic_tags) FROM public.module_scenario_pool s WHERE s.module_id = _module_id
    ) t
    WHERE topic_tag IS NOT NULL
    GROUP BY topic_tag
  ),
  mastery AS (
    SELECT p.topic_tag, avg(p.mastery)::numeric AS learner_mastery_mean
    FROM public.talent_skill_profile p
    WHERE p.module_id = _module_id
    GROUP BY p.topic_tag
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'topic_tag', t.topic_tag,
    'learner_mastery_mean', m.learner_mastery_mean
  ) ORDER BY (m.learner_mastery_mean IS NULL), m.learner_mastery_mean ASC), '[]'::jsonb)
  INTO _topics
  FROM all_tags t
  LEFT JOIN mastery m ON m.topic_tag = t.topic_tag;

  -- Summary counts
  SELECT jsonb_build_object(
    'quiz_items', jsonb_array_length(_quiz),
    'scenario_items', jsonb_array_length(_scenarios),
    'flagged_quiz', (SELECT count(*) FROM jsonb_array_elements(_quiz) e WHERE jsonb_array_length(e->'needs_review') > 0),
    'flagged_scenarios', (SELECT count(*) FROM jsonb_array_elements(_scenarios) e WHERE jsonb_array_length(e->'needs_review') > 0),
    'window_days', GREATEST(LEAST(COALESCE(_days, 30), 90), 1)
  ) INTO _summary;

  RETURN jsonb_build_object(
    'module', jsonb_build_object('id', _module.id, 'title', _module.title, 'content_id', _module.content_id),
    'content', CASE WHEN _content.id IS NULL THEN NULL
                    ELSE jsonb_build_object('id', _content.id, 'title', _content.title, 'is_published', _content.is_published) END,
    'owner', CASE WHEN _instructor.id IS NULL THEN NULL
                  ELSE jsonb_build_object('instructor_id', _instructor.id, 'full_name', _instructor.full_name, 'email', _instructor.email) END,
    'summary', _summary,
    'top_quiz', (SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
                 FROM (SELECT e FROM jsonb_array_elements(_quiz) e
                       WHERE jsonb_array_length(e->'needs_review') > 0
                       LIMIT 10) sub),
    'top_scenarios', (SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
                      FROM (SELECT e FROM jsonb_array_elements(_scenarios) e
                            WHERE jsonb_array_length(e->'needs_review') > 0
                            LIMIT 10) sub),
    'weak_topics', (SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
                    FROM (SELECT e FROM jsonb_array_elements(_topics) e
                          WHERE (e->>'learner_mastery_mean')::numeric < 0.7
                          LIMIT 5) sub)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_authoring_review_digest(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_authoring_review_digest(uuid, integer) TO authenticated, service_role;
