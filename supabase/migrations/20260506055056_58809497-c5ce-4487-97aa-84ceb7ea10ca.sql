CREATE OR REPLACE FUNCTION public.fn_update_skill_mastery_from_attempt()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_content_id uuid;
  v_item_id uuid;
  v_idx int;
  v_answer jsonb;
  v_was_correct boolean;
  v_tag text;
  v_tags text[];
  v_new_mastery numeric;
  v_quality int;
  v_prev_ease numeric;
  v_prev_interval int;
  v_prev_attempts int;
  v_next_interval int;
  v_next_ease numeric;
BEGIN
  SELECT content_id INTO v_content_id
  FROM public.course_modules
  WHERE id = NEW.module_id;

  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_idx IN 1 .. COALESCE(array_length(NEW.item_ids, 1), 0) LOOP
    v_item_id := NEW.item_ids[v_idx];
    v_answer := NEW.answers -> (v_idx - 1);

    IF v_answer IS NULL THEN
      CONTINUE;
    END IF;

    v_was_correct := COALESCE(
      (v_answer ->> 'is_correct')::boolean,
      (v_answer ->> 'correct')::boolean,
      CASE
        WHEN (v_answer ? 'selected_index') AND (v_answer ? 'correct_index')
          THEN (v_answer ->> 'selected_index') = (v_answer ->> 'correct_index')
        ELSE NULL
      END,
      false
    );

    SELECT topic_tags INTO v_tags
    FROM public.module_quiz_pool
    WHERE id = v_item_id;

    IF v_tags IS NULL OR array_length(v_tags, 1) IS NULL THEN
      CONTINUE;
    END IF;

    FOREACH v_tag IN ARRAY v_tags LOOP
      IF v_tag IS NULL OR length(trim(v_tag)) = 0 THEN
        CONTINUE;
      END IF;

      -- Fetch previous SM-2 state (if any)
      SELECT ease, interval_days, attempts
        INTO v_prev_ease, v_prev_interval, v_prev_attempts
      FROM public.talent_skill_profile
      WHERE talent_id = NEW.talent_id
        AND module_id = NEW.module_id
        AND topic_tag = v_tag;

      v_prev_ease := COALESCE(v_prev_ease, 2.50);
      v_prev_interval := COALESCE(v_prev_interval, 1);
      v_prev_attempts := COALESCE(v_prev_attempts, 0);

      -- Compute new EMA mastery (mirror of upsert below)
      v_new_mastery := round(
        (0.7 * COALESCE(
          (SELECT mastery FROM public.talent_skill_profile
            WHERE talent_id = NEW.talent_id AND module_id = NEW.module_id AND topic_tag = v_tag),
          0.50
        ) + 0.3 * CASE WHEN v_was_correct THEN 1 ELSE 0 END)::numeric,
        2
      );

      -- SM-2 quality: map mastery 0..1 -> 0..5
      v_quality := GREATEST(0, LEAST(5, round(v_new_mastery * 5)::int));

      IF v_quality < 3 THEN
        v_next_interval := 1;
        v_next_ease := GREATEST(1.30, v_prev_ease - 0.20);
      ELSE
        v_next_interval := CASE
          WHEN v_prev_attempts = 0 THEN 1
          WHEN v_prev_attempts = 1 THEN 6
          ELSE GREATEST(1, round(v_prev_interval * v_prev_ease)::int)
        END;
        v_next_ease := GREATEST(
          1.30,
          v_prev_ease + (0.10 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02))
        );
      END IF;

      INSERT INTO public.talent_skill_profile AS sp (
        talent_id, content_id, module_id, topic_tag,
        mastery, attempts, correct_count, last_attempt_at,
        interval_days, ease, due_at, last_reviewed_at
      )
      VALUES (
        NEW.talent_id, v_content_id, NEW.module_id, v_tag,
        round((0.7 * 0.50 + 0.3 * CASE WHEN v_was_correct THEN 1 ELSE 0 END)::numeric, 2),
        1,
        CASE WHEN v_was_correct THEN 1 ELSE 0 END,
        NEW.created_at,
        v_next_interval,
        v_next_ease,
        NEW.created_at + (v_next_interval || ' days')::interval,
        NEW.created_at
      )
      ON CONFLICT (talent_id, module_id, topic_tag) DO UPDATE
      SET mastery = round((0.7 * sp.mastery + 0.3 * CASE WHEN v_was_correct THEN 1 ELSE 0 END)::numeric, 2),
          attempts = sp.attempts + 1,
          correct_count = sp.correct_count + CASE WHEN v_was_correct THEN 1 ELSE 0 END,
          last_attempt_at = NEW.created_at,
          interval_days = v_next_interval,
          ease = v_next_ease,
          due_at = NEW.created_at + (v_next_interval || ' days')::interval,
          last_reviewed_at = NEW.created_at,
          updated_at = now();
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;