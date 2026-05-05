
CREATE OR REPLACE FUNCTION public.get_weekly_winners(_start timestamptz, _end timestamptz)
RETURNS TABLE(talent_id uuid, credits_earned numeric, hype_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ph.recipient_talent_id, SUM(ph.creator_share)::numeric, COUNT(*)::bigint
  FROM public.post_hypes ph
  WHERE ph.created_at >= _start AND ph.created_at < _end
  GROUP BY ph.recipient_talent_id
  ORDER BY SUM(ph.creator_share) DESC
  LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.admin_award_credits(_talent uuid, _amount numeric, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.talent_credits(talent_id, balance, earned_balance, contact_bonus_balance)
    VALUES (_talent, 0, 0, _amount)
    ON CONFLICT (talent_id) DO UPDATE
      SET contact_bonus_balance = COALESCE(public.talent_credits.contact_bonus_balance,0) + _amount,
          updated_at = now();
  INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, description, is_earned, source)
    VALUES (_talent, _amount, 'credit', 'leaderboard_bonus', _reason, false, 'admin');
END;
$$;
