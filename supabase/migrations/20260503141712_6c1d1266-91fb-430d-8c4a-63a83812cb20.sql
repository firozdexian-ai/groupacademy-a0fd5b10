-- Enrich content gig generation with deep research prompt + course/module context.
-- Replaces existing function with same signature.
CREATE OR REPLACE FUNCTION public.generate_content_gigs_for_course(_content_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id uuid;
  v_inserted int := 0;
  v_module RECORD;
  v_course RECORD;
  v_stage int;
  v_stage_label text;
  v_existing int;
  v_brief text;
  v_format text;
  v_reward numeric;
  v_rtype text;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_school_id := public.school_id_for_content(_content_id);
  SELECT id, title, description, instructor_name
    INTO v_course
    FROM public.content
    WHERE id = _content_id;

  FOR v_module IN
    SELECT id, title, description
      FROM public.course_modules
      WHERE content_id = _content_id
      ORDER BY display_order
  LOOP
    FOR v_stage IN 1..6 LOOP
      v_stage_label := CASE v_stage
        WHEN 1 THEN 'Orientation' WHEN 2 THEN 'Learn' WHEN 3 THEN 'Discuss'
        WHEN 4 THEN 'Practice'    WHEN 5 THEN 'Assess' WHEN 6 THEN 'Progress'
      END;

      -- Skip if a real resource already exists for this stage
      SELECT COUNT(*) INTO v_existing
      FROM public.module_resources
      WHERE module_id = v_module.id AND stage_number = v_stage
        AND ((resource_url IS NOT NULL AND resource_url <> '')
             OR (resource_data IS NOT NULL AND resource_data::text <> '{}'));
      IF v_existing > 0 THEN CONTINUE; END IF;

      -- Skip if an active gig already exists
      SELECT COUNT(*) INTO v_existing
      FROM public.content_gigs
      WHERE module_id = v_module.id AND stage_number = v_stage
        AND status IN ('open','claimed','submitted','approved');
      IF v_existing > 0 THEN CONTINUE; END IF;

      v_rtype := CASE v_stage
        WHEN 1 THEN 'video' WHEN 2 THEN 'slides' WHEN 3 THEN 'audio_podcast'
        WHEN 4 THEN 'flashcards' WHEN 5 THEN 'quiz' WHEN 6 THEN 'report'
      END;

      v_format := CASE v_stage
        WHEN 1 THEN '60-90s intro video (mp4 link or YouTube unlisted)'
        WHEN 2 THEN 'Slide deck (PDF) + 200-word summary'
        WHEN 3 THEN '5 discussion prompts + optional 5-min audio brief'
        WHEN 4 THEN '10 flashcards (front/back) as JSON'
        WHEN 5 THEN '5-10 question quiz (MCQ) as JSON'
        WHEN 6 THEN 'Capstone reflection prompt + scoring rubric'
      END;

      v_reward := CASE v_stage
        WHEN 1 THEN 30 WHEN 2 THEN 20 WHEN 3 THEN 10
        WHEN 4 THEN 15 WHEN 5 THEN 15 WHEN 6 THEN 10
      END;

      v_brief :=
        'COURSE: ' || COALESCE(v_course.title,'(untitled)') || E'\n' ||
        'MODULE: ' || v_module.title || E'\n' ||
        'STAGE:  ' || v_stage_label || ' (' || v_rtype || ')' || E'\n' ||
        E'\n--- DEEP RESEARCH PROMPT ---\n' ||
        'You are producing the "' || v_stage_label || '" learning artifact for the module "' || v_module.title ||
        '" inside the course "' || COALESCE(v_course.title,'') || '".' || E'\n' ||
        'Module goal: ' || COALESCE(v_module.description, 'See module title.') || E'\n' ||
        'Course summary: ' || COALESCE(v_course.description, 'See course title.') || E'\n\n' ||
        'Research with reputable, current sources. Cite at least 3 sources. Tailor language for working professionals.' || E'\n' ||
        'Deliverable: ' || v_format || E'\n' ||
        'Quality bar: clear structure, accurate, jargon-free, immediately usable inside the learning player.';

      INSERT INTO public.content_gigs (
        module_id, content_id, school_id, stage_number, resource_type,
        title, brief, expected_format, credit_reward
      ) VALUES (
        v_module.id, _content_id, v_school_id, v_stage, v_rtype,
        v_stage_label || ' resource for: ' || v_module.title,
        v_brief, v_format, v_reward
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;
  RETURN v_inserted;
END;
$$;