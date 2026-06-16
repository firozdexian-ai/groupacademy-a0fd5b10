-- Drop legacy integer function overloads of credit functions to resolve PGRST203 candidate selection conflicts
DROP FUNCTION IF EXISTS public.deduct_credits(integer, text, text, text);
DROP FUNCTION IF EXISTS public.add_credits(uuid, integer, text, text);

-- Ensure authenticated users have execution privileges on the surviving numeric overloads
GRANT EXECUTE ON FUNCTION public.deduct_credits(numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, numeric, text, text) TO authenticated;
