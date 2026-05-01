-- Fix infinite recursion in company_members RLS by using SECURITY DEFINER helpers

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
$$;

DROP POLICY IF EXISTS "Owners manage own company memberships" ON public.company_members;
DROP POLICY IF EXISTS "Members view own membership" ON public.company_members;
DROP POLICY IF EXISTS "Admins manage memberships" ON public.company_members;

CREATE POLICY "Members view memberships"
ON public.company_members FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_company_member(auth.uid(), company_id)
  OR public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Owners manage own company memberships"
ON public.company_members FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Platform admins manage memberships"
ON public.company_members FOR ALL
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));
