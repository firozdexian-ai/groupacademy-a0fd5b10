/**
 * Companies Domain Hooks — Followed Companies Subsystem
 * Version: 2024 Highly Professional SAAS UI
 * Rules: Enforces Automated Efficiency for Talent operations with silent anomaly routing.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CompanyFollowResult {
  companyName: string;
  nowFollowing: boolean;
}

/**
 * Fetch and manage the unique list of corporate entities followed by the authenticated user.
 * Enforces a 5-minute cache consistency layer to maximize high-performance scaling.
 */
export function useFollowedCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followed-companies", user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Set<string>> => {
      if (!user?.id) return new Set();
      
      const { data, error } = await supabase
        .from("followed_companies")
        .select("company_name")
        .eq("user_id", user.id);
        
      if (error) {
        // Digital Workforce Rule: Log client boundary anomalies cleanly to central system logs
        console.error("Talent followed companies database query failed:", {
          userId: user.id,
          message: error.message,
          code: error.code,
        });
        throw error;
      }
      
      return new Set((data ?? []).map((r) => r.company_name));
    },
  });
}

/**
 * Atomic mutation framework to optimistically toggle employer follow relationships.
 * Automatically handles failure rollbacks and propagates operational error traces.
 */
export function useToggleFollowCompany() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (companyName: string): Promise<CompanyFollowResult> => {
      if (!user?.id) {
        navigate("/auth?returnTo=/app/jobs?tab=company");
        throw new Error("auth-required");
      }
      
      const key = ["followed-companies", user.id];
      const current = qc.getQueryData<Set<string>>(key) ?? new Set<string>();
      const isFollowing = current.has(companyName);

      if (isFollowing) {
        const { error } = await supabase
          .from("followed_companies")
          .delete()
          .eq("user_id", user.id)
          .eq("company_name", companyName);
          
        if (error) {
          console.error("Automated follow deletion intercepted an error condition:", {
            userId: user.id,
            companyName,
            message: error.message,
            code: error.code,
          });
          throw error;
        }
        
        return { companyName, nowFollowing: false };
      } else {
        const { error } = await supabase
          .from("followed_companies")
          .insert({ user_id: user.id, company_name: companyName });
          
        if (error) {
          console.error("Automated follow insertion intercepted an error condition:", {
            userId: user.id,
            companyName,
            message: error.message,
            code: error.code,
          });
          throw error;
        }
        
        return { companyName, nowFollowing: true };
      }
    },
    onMutate: async (companyName: string) => {
      if (!user?.id) return;
      const key = ["followed-companies", user.id];
      await qc.cancelQueries({ queryKey: key });
      
      const prev = qc.getQueryData<Set<string>>(key) ?? new Set<string>();
      const next = new Set(prev);
      
      if (next.has(companyName)) next.delete(companyName);
      else next.add(companyName);
      
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (err: any, _v, ctx) => {
      if (err?.message === "auth-required") return;
      if (user?.id && ctx?.prev) {
        qc.setQueryData(["followed-companies", user.id], ctx.prev);
      }
      toast.error("We couldn't update your preferences. Please try again in a moment.");
    },
    onSuccess: ({ nowFollowing, companyName }) => {
      toast.success(nowFollowing ? `You are now following ${companyName}` : `You unfollowed ${companyName}`);
    },
    onSettled: () => {
      if (user?.id) qc.invalidateQueries({ queryKey: ["followed-companies", user.id] });
    },
  });
}