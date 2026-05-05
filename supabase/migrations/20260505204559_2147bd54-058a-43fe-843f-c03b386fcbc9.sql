
-- ============ POST COMMENTS ============
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  tip_count integer NOT NULL DEFAULT 0,
  tip_credits numeric(12,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments publicly readable"
  ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated authors insert own comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (author_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Authors delete own comments"
  ON public.post_comments FOR DELETE
  USING (author_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- ============ COMMENT TIPS ============
CREATE TABLE IF NOT EXISTS public.comment_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  sender_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  recipient_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  amount numeric(12,1) NOT NULL CHECK (amount IN (2,5,10)),
  creator_share numeric(12,1) NOT NULL,
  platform_share numeric(12,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comment_tips_comment ON public.comment_tips(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_tips_recipient ON public.comment_tips(recipient_talent_id);

ALTER TABLE public.comment_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tips publicly readable"
  ON public.comment_tips FOR SELECT USING (true);

CREATE POLICY "Senders insert own tips"
  ON public.comment_tips FOR INSERT
  WITH CHECK (sender_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- ============ TALENT STREAK + REFERRAL COLUMNS ============
ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_post_date date,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.talents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_talents_referred_by ON public.talents(referred_by);
CREATE INDEX IF NOT EXISTS idx_talents_current_streak ON public.talents(current_streak DESC);

-- ============ STREAK TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_talent_streak()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_talent uuid;
  v_last date;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_new_streak integer;
  v_longest integer;
BEGIN
  IF NEW.author_user_id IS NULL THEN RETURN NEW; END IF;
  SELECT id, last_post_date, longest_streak INTO v_talent, v_last, v_longest
    FROM public.talents WHERE user_id = NEW.author_user_id;
  IF v_talent IS NULL THEN RETURN NEW; END IF;

  IF v_last = v_today THEN
    RETURN NEW;
  ELSIF v_last = v_today - 1 THEN
    UPDATE public.talents
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_post_date = v_today
      WHERE id = v_talent
      RETURNING current_streak INTO v_new_streak;
  ELSE
    UPDATE public.talents
      SET current_streak = 1,
          longest_streak = GREATEST(longest_streak, 1),
          last_post_date = v_today
      WHERE id = v_talent
      RETURNING current_streak INTO v_new_streak;
  END IF;

  -- grant streak badges
  IF v_new_streak >= 7 THEN
    INSERT INTO public.creator_badges(talent_id, badge) VALUES (v_talent, 'streak_7')
      ON CONFLICT DO NOTHING;
  END IF;
  IF v_new_streak >= 30 THEN
    INSERT INTO public.creator_badges(talent_id, badge) VALUES (v_talent, 'streak_30')
      ON CONFLICT DO NOTHING;
  END IF;
  IF v_new_streak >= 100 THEN
    INSERT INTO public.creator_badges(talent_id, badge) VALUES (v_talent, 'streak_100')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_talent_streak ON public.feed_posts;
CREATE TRIGGER trg_update_talent_streak
  AFTER INSERT ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_talent_streak();

-- ============ COMMENT TIP RPC ============
CREATE OR REPLACE FUNCTION public.tip_comment(_comment_id uuid, _amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sender uuid;
  v_recipient uuid;
  v_post uuid;
  v_recipient_user uuid;
  v_bal numeric; v_earned numeric; v_bonus numeric;
  v_creator_share numeric;
  v_platform_share numeric;
  v_take numeric;
BEGIN
  IF _amount NOT IN (2,5,10) THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;

  SELECT id INTO v_sender FROM public.talents WHERE user_id = auth.uid();
  IF v_sender IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT pc.author_talent_id, pc.post_id INTO v_recipient, v_post
    FROM public.post_comments pc WHERE pc.id = _comment_id;
  IF v_recipient IS NULL THEN RAISE EXCEPTION 'COMMENT_NOT_FOUND'; END IF;
  IF v_recipient = v_sender THEN RAISE EXCEPTION 'CANNOT_TIP_SELF'; END IF;

  v_creator_share := (_amount * 0.9)::numeric(12,1);
  v_platform_share := (_amount - v_creator_share)::numeric(12,1);

  SELECT balance, earned_balance, contact_bonus_balance
    INTO v_bal, v_earned, v_bonus
    FROM public.talent_credits WHERE talent_id = v_sender FOR UPDATE;

  IF COALESCE(v_bal,0)+COALESCE(v_earned,0)+COALESCE(v_bonus,0) < _amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  -- deduct: bonus -> balance -> earned
  v_take := LEAST(COALESCE(v_bonus,0), _amount);
  IF v_take > 0 THEN
    UPDATE public.talent_credits SET contact_bonus_balance = contact_bonus_balance - v_take, updated_at=now() WHERE talent_id=v_sender;
  END IF;
  IF v_take < _amount THEN
    DECLARE v_rem numeric := _amount - v_take; v_b numeric;
    BEGIN
      v_b := LEAST(COALESCE(v_bal,0), v_rem);
      IF v_b > 0 THEN
        UPDATE public.talent_credits SET balance = balance - v_b, updated_at=now() WHERE talent_id=v_sender;
        v_rem := v_rem - v_b;
      END IF;
      IF v_rem > 0 THEN
        UPDATE public.talent_credits SET earned_balance = earned_balance - v_rem, updated_at=now() WHERE talent_id=v_sender;
      END IF;
    END;
  END IF;

  -- ledger debit
  INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, reference_id, description, is_earned, source)
  VALUES (v_sender, -_amount, 'debit', 'comment_tip', _comment_id, 'Tipped a comment', false, 'feed');

  -- credit creator earned
  UPDATE public.talent_credits SET earned_balance = COALESCE(earned_balance,0) + v_creator_share, updated_at=now() WHERE talent_id = v_recipient;
  INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, reference_id, description, is_earned, source)
  VALUES (v_recipient, v_creator_share, 'credit', 'comment_tip', _comment_id, 'Comment tip received', true, 'feed');

  -- update aggregate counts
  UPDATE public.post_comments
    SET tip_count = tip_count + 1, tip_credits = tip_credits + _amount
    WHERE id = _comment_id;

  -- record tip
  INSERT INTO public.comment_tips(comment_id, post_id, sender_talent_id, recipient_talent_id, amount, creator_share, platform_share)
  VALUES (_comment_id, v_post, v_sender, v_recipient, _amount, v_creator_share, v_platform_share);

  -- notify recipient
  INSERT INTO public.notifications(talent_id, type, title, message, icon, link)
  VALUES (v_recipient, 'comment_tip', 'You received a tip!', 'Someone tipped your comment ' || _amount || ' credits', 'gift', '/feed');

  RETURN jsonb_build_object('ok', true, 'creator_share', v_creator_share);
END;
$$;

GRANT EXECUTE ON FUNCTION public.tip_comment(uuid, numeric) TO authenticated;

-- ============ REFERRAL TRIGGER ============
CREATE OR REPLACE FUNCTION public.grant_referral_on_first_connection()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referrer uuid;
  v_prior integer;
BEGIN
  IF NEW.status <> 'accepted' OR OLD.status = 'accepted' THEN RETURN NEW; END IF;

  SELECT referred_by INTO v_referrer FROM public.talents WHERE id = NEW.sender_talent_id;
  IF v_referrer IS NULL THEN RETURN NEW; END IF;

  -- only on first accepted connection by this sender
  SELECT COUNT(*) INTO v_prior FROM public.talent_connections
    WHERE sender_talent_id = NEW.sender_talent_id AND status='accepted' AND id <> NEW.id;
  IF v_prior > 0 THEN RETURN NEW; END IF;

  UPDATE public.talent_credits
    SET earned_balance = COALESCE(earned_balance,0) + 10, updated_at = now()
    WHERE talent_id = v_referrer;

  INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, reference_id, description, is_earned, source)
  VALUES (v_referrer, 10, 'credit', 'referral_bonus', NEW.id, 'Referral bonus: invitee made first connection', true, 'referral');

  INSERT INTO public.notifications(talent_id, type, title, message, icon, link)
  VALUES (v_referrer, 'referral', 'Referral bonus earned!', 'You earned 10 credits from a successful invite', 'gift', '/app/withdrawals');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_referral_first_conn ON public.talent_connections;
CREATE TRIGGER trg_grant_referral_first_conn
  AFTER UPDATE ON public.talent_connections
  FOR EACH ROW EXECUTE FUNCTION public.grant_referral_on_first_connection();

-- ============ LEADERBOARD ============
CREATE TABLE IF NOT EXISTS public.leaderboard_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  credits_awarded numeric(12,1) NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_lp_week ON public.leaderboard_payouts(week_start);

ALTER TABLE public.leaderboard_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payouts publicly readable"
  ON public.leaderboard_payouts FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.v_weekly_leaderboard AS
SELECT
  t.id AS talent_id,
  t.full_name,
  t.profile_photo_url,
  COALESCE(SUM(ph.creator_share), 0)::numeric(14,1) AS credits_earned,
  COUNT(ph.id) AS hype_count
FROM public.talents t
LEFT JOIN public.post_hypes ph
  ON ph.recipient_talent_id = t.id
  AND ph.created_at >= date_trunc('week', now())
GROUP BY t.id, t.full_name, t.profile_photo_url
HAVING COUNT(ph.id) > 0
ORDER BY credits_earned DESC
LIMIT 50;
