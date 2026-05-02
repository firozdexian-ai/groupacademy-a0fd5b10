/**
 * Loads currency rates from `public.currency_rates` (cached for 1 hour).
 * Pair with `formatMoney()` from `@/lib/currency`.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrencyRate } from "@/lib/currency";

export function useCurrencyRates() {
  const { data, isLoading } = useQuery({
    queryKey: ["currency-rates"],
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<CurrencyRate[]> => {
      const { data, error } = await supabase
        .from("currency_rates")
        .select("code,symbol,name,usd_rate,country_codes")
        .order("code");
      if (error) throw error;
      return (data ?? []) as CurrencyRate[];
    },
  });
  return { rates: data ?? [], isLoading };
}
