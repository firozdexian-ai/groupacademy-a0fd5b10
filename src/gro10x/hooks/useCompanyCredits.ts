/**
 * Returns the current Gro10x company's credit balance + a 90-day ledger.
 * Reads `company_credits` and `company_credit_transactions` directly under
 * the new member-read RLS policies.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CompanyCreditTxn {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  service_type: string | null;
  description: string | null;
  created_at: string;
}

export function useCompanyCredits() {
  const { user } = useAuth();

  const companyQuery = useQuery({
    queryKey: ["gro10x-company-id", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      return data?.company_id ?? null;
    },
  });

  const companyId = companyQuery.data ?? null;

  const balanceQuery = useQuery({
    queryKey: ["company-credits", companyId],
    enabled: !!companyId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_credits")
        .select("balance, earned_balance")
        .eq("company_id", companyId!)
        .maybeSingle();
      return {
        balance: Number(data?.balance ?? 0),
        earnedBalance: Number(data?.earned_balance ?? 0),
      };
    },
  });

  const ledgerQuery = useQuery({
    queryKey: ["company-credit-ledger", companyId],
    enabled: !!companyId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<CompanyCreditTxn[]> => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("company_credit_transactions")
        .select("id, amount, balance_after, transaction_type, service_type, description, created_at")
        .eq("company_id", companyId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []).map((r) => ({
        ...r,
        amount: Number(r.amount),
        balance_after: Number(r.balance_after),
      })) as CompanyCreditTxn[];
    },
  });

  // Live balance updates via realtime subscription on the company's row
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`company-credits-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_credits", filter: `company_id=eq.${companyId}` },
        () => balanceQuery.refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "company_credit_transactions",
          filter: `company_id=eq.${companyId}`,
        },
        () => ledgerQuery.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return {
    companyId,
    balance: balanceQuery.data?.balance ?? 0,
    earnedBalance: balanceQuery.data?.earnedBalance ?? 0,
    ledger: ledgerQuery.data ?? [],
    isLoading: companyQuery.isLoading || balanceQuery.isLoading,
  };
}
