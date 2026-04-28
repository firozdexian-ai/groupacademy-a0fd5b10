import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { ServiceType, getServiceCost } from "@/lib/creditPricing";
import { useToast } from "@/hooks/use-toast";
import { emailNotifications } from "@/lib/emailNotifications";

/**
 * GroUp Academy: Fiscal Ingress & Ledger Node
 * CTO Reference: Authoritative controller for institutional economy.
 * Fix Log: Exposed deductCustomAmount and addCredits to the public interface.
 */

export interface CreditTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  serviceType: string | null;
  description: string | null;
  createdAt: string;
}

interface CreditBalance {
  balance: number;
  earnedBalance: number;
  isLoading: boolean;
}

const isValidUUID = (id: any): boolean => {
  if (!id || typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function useCredits() {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [creditData, setCreditData] = useState<CreditBalance>({ balance: 0, earnedBalance: 0, isLoading: true });
  const [transactionHistory, setTransactionHistory] = useState<CreditTransaction[]>([]);

  const fetchBalance = useCallback(async () => {
    if (!talent?.id) {
      setCreditData({ balance: 0, earnedBalance: 0, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("talent_credits")
        .select("balance, earned_balance")
        .eq("talent_id", talent.id)
        .maybeSingle();

      if (error) throw error;

      setCreditData({
        balance: data?.balance ?? 0,
        earnedBalance: (data as any)?.earned_balance ?? 0,
        isLoading: false,
      });

      const { data: txData } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txData) {
        setTransactionHistory(
          txData.map((tx) => ({
            id: tx.id,
            amount: tx.amount,
            balanceAfter: tx.balance_after,
            transactionType: tx.transaction_type,
            serviceType: tx.service_type,
            description: tx.description,
            createdAt: tx.created_at,
          })),
        );
      }
    } catch (err) {
      console.error("FISCAL_SYNC_FAULT:", err);
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const executeDirectDeduction = async (
    amount: number,
    serviceType: string,
    referenceId?: string,
    description?: string,
  ) => {
    if (!talent?.id) return { success: false, error: "AUTH_REQUIRED" };

    const { data: current } = await supabase
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talent.id)
      .single();
    if (!current || current.balance < amount) return { success: false, error: "FISCAL_DEFICIT" };

    const newBalance = current.balance - amount;
    await supabase.from("talent_credits").update({ balance: newBalance }).eq("talent_id", talent.id);

    const safeRefId = isValidUUID(referenceId) ? referenceId : null;
    await supabase.from("credit_transactions").insert({
      talent_id: talent.id,
      amount: -amount,
      balance_after: newBalance,
      transaction_type: "usage",
      service_type: serviceType,
      description: description,
      reference_id: safeRefId,
    });

    return { success: true, new_balance: newBalance };
  };

  const deductCredits = useCallback(
    async (service: ServiceType, referenceId?: string, description?: string) => {
      const cost = getServiceCost(service);
      return await deductCustomAmount(cost, service, referenceId, description);
    },
    [talent?.id, creditData.balance],
  );

  const deductCustomAmount = useCallback(
    async (amount: number, serviceType: string, referenceId?: string, description?: string): Promise<boolean> => {
      if (!talent?.id) return false;
      if (creditData.balance < amount) {
        toast({ title: "FISCAL_DEFICIT", variant: "destructive" });
        return false;
      }

      const safeRefId = isValidUUID(referenceId) ? referenceId : null;
      try {
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: amount,
          p_service_type: serviceType,
          p_reference_id: safeRefId,
          p_description: description || `Service: ${serviceType}`,
        });

        if (!error && data?.success) {
          setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
          return true;
        }

        const fallback = await executeDirectDeduction(amount, serviceType, referenceId, description);
        if (fallback.success) {
          setCreditData((prev) => ({ ...prev, balance: fallback.new_balance as number }));
          return true;
        }
        return false;
      } catch (err) {
        return false;
      }
    },
    [talent?.id, creditData.balance, toast],
  );

  const addCredits = useCallback(
    async (amount: number, type: "welcome_bonus" | "purchase" | "refund", description?: string) => {
      if (!talent?.id) return false;
      try {
        const { data: existing } = await supabase
          .from("talent_credits")
          .select("balance")
          .eq("talent_id", talent.id)
          .maybeSingle();
        const newBalance = (existing?.balance ?? 0) + amount;

        await supabase.from("talent_credits").upsert({ talent_id: talent.id, balance: newBalance });
        await supabase.from("credit_transactions").insert({
          talent_id: talent.id,
          amount,
          balance_after: newBalance,
          transaction_type: type,
          description: description || `${type} sync`,
        });

        setCreditData((prev) => ({ ...prev, balance: newBalance }));
        if (type === "welcome_bonus") toast({ title: "Welcome Bonus! 🎉" });
        return true;
      } catch (err) {
        return false;
      }
    },
    [talent?.id, toast],
  );

  return {
    balance: creditData.balance,
    earnedBalance: creditData.earnedBalance,
    freeBalance: creditData.balance - creditData.earnedBalance,
    isLoading: creditData.isLoading,
    canAfford: (s: ServiceType) => creditData.balance >= getServiceCost(s),
    canAffordAmount: (a: number) => creditData.balance >= a,
    getServiceCost: (s: ServiceType) => getServiceCost(s),
    deductCredits,
    deductCustomAmount, // FIXED: Now exposed to public interface
    addCredits, // FIXED: Now exposed to public interface
    refreshBalance: fetchBalance,
    transactionHistory,
  };
}
