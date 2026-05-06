import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrgLearningHealth(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-learning-health", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("org_learning_health", {
        p_company_id: companyId!,
      });
      if (error) throw error;
      return data as Record<string, any>;
    },
  });
}

export function useOrgAssignments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-assignments", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_course_assignments")
        .select("*, content:content_id(id,title), cohort:cohort_id(id,name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOrgTeamMastery(companyId: string | undefined, contentId?: string) {
  return useQuery({
    queryKey: ["org-team-mastery", companyId, contentId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("org_team_mastery", {
        p_company_id: companyId!,
        p_content_id: contentId ?? null,
      });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

export function useOrgSeats(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-seats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_learning_seats")
        .select("*, content:content_id(id,title)")
        .eq("company_id", companyId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOrgWallet(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-wallet", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: bal } = await supabase
        .from("company_credits")
        .select("balance, earned_balance")
        .eq("company_id", companyId!)
        .maybeSingle();
      const { data: txns } = await supabase
        .from("company_credit_transactions")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return { balance: bal, transactions: txns ?? [] };
    },
  });
}

export function useAssignTalents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      company_id: string;
      content_id: string;
      cohort_id?: string | null;
      user_ids: string[];
      due_at?: string | null;
      budget_per_seat?: number | null;
      note?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("org_assign_talents", {
        p_company_id: input.company_id,
        p_content_id: input.content_id,
        p_cohort_id: input.cohort_id ?? null,
        p_user_ids: input.user_ids,
        p_due_at: input.due_at ?? null,
        p_budget_per_seat: input.budget_per_seat ?? null,
        p_note: input.note ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["org-assignments", vars.company_id] });
      qc.invalidateQueries({ queryKey: ["org-learning-health", vars.company_id] });
      qc.invalidateQueries({ queryKey: ["org-wallet", vars.company_id] });
    },
  });
}
