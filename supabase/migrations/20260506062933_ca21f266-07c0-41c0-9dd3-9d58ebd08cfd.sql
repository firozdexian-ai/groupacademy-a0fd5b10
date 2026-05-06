-- 2.5.a — Standardise talent_scenario_run.evaluation JSON shape
-- Expected shape:
-- {
--   "version": 1,
--   "overall": 0.72,                       -- optional, 0..1
--   "rubric_id": "default_v1",             -- optional
--   "evaluated_at": "2026-05-06T...Z",     -- optional ISO timestamp
--   "topics": [
--     { "tag": "negotiation_anchoring", "score": 0.8, "weight": 1.0, "notes": "..." }
--   ]
-- }

-- Validation function: permissive — only enforces shape when evaluation is set.
-- Using a trigger (not a CHECK) per project standard so we can use non-immutable
-- expressions and evolve the rules without breaking historical rows.
CREATE OR REPLACE FUNCTION public.fn_validate_scenario_evaluation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_topics jsonb;
  v_topic  jsonb;
  v_score  numeric;
  v_weight numeric;
BEGIN
  IF NEW.evaluation IS NULL THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.evaluation) <> 'object' THEN
    RAISE EXCEPTION 'evaluation must be a JSON object';
  END IF;

  IF NOT (NEW.evaluation ? 'version') THEN
    RAISE EXCEPTION 'evaluation must include a numeric "version"';
  END IF;

  IF jsonb_typeof(NEW.evaluation->'version') <> 'number' THEN
    RAISE EXCEPTION 'evaluation.version must be a number';
  END IF;

  IF NOT (NEW.evaluation ? 'topics') THEN
    RAISE EXCEPTION 'evaluation must include a "topics" array';
  END IF;

  v_topics := NEW.evaluation->'topics';

  IF jsonb_typeof(v_topics) <> 'array' THEN
    RAISE EXCEPTION 'evaluation.topics must be an array';
  END IF;

  -- Per-topic shape check
  FOR v_topic IN SELECT * FROM jsonb_array_elements(v_topics) LOOP
    IF jsonb_typeof(v_topic) <> 'object' THEN
      RAISE EXCEPTION 'each evaluation.topics[] entry must be an object';
    END IF;
    IF NOT (v_topic ? 'tag') OR jsonb_typeof(v_topic->'tag') <> 'string' THEN
      RAISE EXCEPTION 'each topic must have a string "tag"';
    END IF;
    IF NOT (v_topic ? 'score') OR jsonb_typeof(v_topic->'score') <> 'number' THEN
      RAISE EXCEPTION 'each topic must have a numeric "score"';
    END IF;
    v_score := (v_topic->>'score')::numeric;
    IF v_score < 0 OR v_score > 1 THEN
      RAISE EXCEPTION 'topic score must be between 0 and 1 (got %)', v_score;
    END IF;
    IF v_topic ? 'weight' THEN
      IF jsonb_typeof(v_topic->'weight') <> 'number' THEN
        RAISE EXCEPTION 'topic weight must be numeric when present';
      END IF;
      v_weight := (v_topic->>'weight')::numeric;
      IF v_weight < 0 THEN
        RAISE EXCEPTION 'topic weight must be >= 0';
      END IF;
    END IF;
  END LOOP;

  -- Optional overall bound check
  IF NEW.evaluation ? 'overall' THEN
    IF jsonb_typeof(NEW.evaluation->'overall') <> 'number' THEN
      RAISE EXCEPTION 'evaluation.overall must be numeric when present';
    END IF;
    IF (NEW.evaluation->>'overall')::numeric < 0
       OR (NEW.evaluation->>'overall')::numeric > 1 THEN
      RAISE EXCEPTION 'evaluation.overall must be between 0 and 1';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_scenario_evaluation ON public.talent_scenario_run;

CREATE TRIGGER trg_validate_scenario_evaluation
BEFORE INSERT OR UPDATE OF evaluation ON public.talent_scenario_run
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_scenario_evaluation();

COMMENT ON COLUMN public.talent_scenario_run.evaluation IS
  'Structured AI evaluation of the scenario run. Shape (v1): { version:int, overall?:0..1, rubric_id?:string, evaluated_at?:iso, topics:[{tag:string, score:0..1, weight?:number>=0, notes?:string}] }. Validated by trg_validate_scenario_evaluation.';