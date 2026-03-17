
-- Create workforce role type enum
CREATE TYPE public.workforce_role_type AS ENUM (
  'country_director',
  'head_of_ta',
  'talent_executive',
  'bde',
  'academy_chancellor',
  'school_dean',
  'career_abroad_exec'
);

-- Create workforce_members table
CREATE TABLE public.workforce_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  role_type workforce_role_type NOT NULL,
  specialization JSONB DEFAULT '{}',
  reports_to UUID REFERENCES public.workforce_members(id) ON DELETE SET NULL,
  country TEXT DEFAULT 'BD',
  city TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'probation', 'inactive')),
  hired_at TIMESTAMPTZ DEFAULT now(),
  probation_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(talent_id)
);

-- Create talent_assignments table (the "string" between talent and executive)
CREATE TABLE public.talent_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.workforce_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(talent_id, assigned_to)
);

-- Enable RLS
ALTER TABLE public.workforce_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for workforce_members
CREATE POLICY "Admins can manage workforce members"
  ON public.workforce_members FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Workforce members can view own record"
  ON public.workforce_members FOR SELECT
  TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- RLS policies for talent_assignments
CREATE POLICY "Admins can manage talent assignments"
  ON public.talent_assignments FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Workforce members can view own assignments"
  ON public.talent_assignments FOR SELECT
  TO authenticated
  USING (assigned_to IN (
    SELECT id FROM public.workforce_members
    WHERE talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  ));

-- Trigger for updated_at on workforce_members
CREATE TRIGGER update_workforce_members_updated_at
  BEFORE UPDATE ON public.workforce_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commission engine: 10% kickback trigger on credit_transactions
-- Only fires on credit USAGE (negative amounts), not on awards/bonuses
CREATE OR REPLACE FUNCTION public.commission_kickback()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_assignment RECORD;
  v_exec_talent_id UUID;
  v_commission INTEGER;
  v_exec_balance INTEGER;
  v_new_balance INTEGER;
  v_new_earned INTEGER;
BEGIN
  -- Only process credit usage (negative amounts) for service_usage transactions
  IF NEW.amount >= 0 OR NEW.transaction_type != 'service_usage' THEN
    RETURN NEW;
  END IF;

  -- Find the assigned workforce member for this talent
  SELECT ta.assigned_to, wm.talent_id
  INTO v_assignment
  FROM talent_assignments ta
  JOIN workforce_members wm ON wm.id = ta.assigned_to
  WHERE ta.talent_id = NEW.talent_id
    AND wm.status = 'active'
  LIMIT 1;

  IF v_assignment IS NULL THEN
    RETURN NEW;
  END IF;

  v_exec_talent_id := v_assignment.talent_id;

  -- Calculate 10% commission (minimum 1 credit)
  v_commission := GREATEST(1, ABS(NEW.amount) / 10);

  -- Get or create exec's credit balance
  SELECT balance, earned_balance INTO v_exec_balance, v_new_earned
  FROM talent_credits
  WHERE talent_id = v_exec_talent_id
  FOR UPDATE;

  IF v_exec_balance IS NULL THEN
    v_exec_balance := 0;
    v_new_earned := 0;
    INSERT INTO talent_credits (talent_id, balance, earned_balance)
    VALUES (v_exec_talent_id, 0, 0);
  END IF;

  v_new_balance := v_exec_balance + v_commission;
  v_new_earned := COALESCE(v_new_earned, 0) + v_commission;

  UPDATE talent_credits
  SET balance = v_new_balance, earned_balance = v_new_earned
  WHERE talent_id = v_exec_talent_id;

  -- Record commission transaction
  INSERT INTO credit_transactions (
    talent_id, amount, balance_after, transaction_type, service_type,
    description, is_earned
  ) VALUES (
    v_exec_talent_id, v_commission, v_new_balance, 'commission',
    NEW.service_type,
    'Commission: 10% of ' || ABS(NEW.amount) || ' credits from talent activity',
    true
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER commission_on_credit_usage
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.commission_kickback();
