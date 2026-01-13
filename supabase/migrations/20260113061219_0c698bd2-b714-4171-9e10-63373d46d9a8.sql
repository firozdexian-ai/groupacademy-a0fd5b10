-- 1. Allow Admins to View ALL Credit Balances
CREATE POLICY "Admins can view all credit balances"
ON public.talent_credits
FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);

-- 2. Allow Admins to View ALL Transactions
CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = 'admin'
  )
);