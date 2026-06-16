-- Drop legacy integer function overloads of credit functions
DROP FUNCTION IF EXISTS public.deduct_credits(integer, text, text, text);
DROP FUNCTION IF EXISTS public.add_credits(uuid, integer, text, text);

-- Re-grant execution privileges on the surviving numeric variants to authenticated
GRANT EXECUTE ON FUNCTION public.deduct_credits(numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, numeric, text, text) TO authenticated;

-- Harden Row Level Security on destination_agent_messages
ALTER TABLE public.destination_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_dam" ON public.destination_agent_messages;
DROP POLICY IF EXISTS "users_select_dam" ON public.destination_agent_messages;
DROP POLICY IF EXISTS "users_insert_dam" ON public.destination_agent_messages;
DROP POLICY IF EXISTS "users_update_dam" ON public.destination_agent_messages;
DROP POLICY IF EXISTS "users_delete_dam" ON public.destination_agent_messages;
DROP POLICY IF EXISTS "admins_view_dam" ON public.destination_agent_messages;

CREATE POLICY "users_select_dam" ON public.destination_agent_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_insert_dam" ON public.destination_agent_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_dam" ON public.destination_agent_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_dam" ON public.destination_agent_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_view_dam" ON public.destination_agent_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
