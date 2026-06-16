import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCompanyCreditsBalance(companyId: string | null) {
  return useQuery({
    queryKey: ["company-credits-balance", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_credits")
        .select("balance")
        .eq("company_id", companyId!)
        .maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
    staleTime: 30 * 1000,
  });
}
