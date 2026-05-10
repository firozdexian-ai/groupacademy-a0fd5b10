import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GigNode { id: string; title: string; status: string; reward_amount: number; created_at: string; }
export interface MarketplaceGig { id: string; title: string; status: string; budget: number; created_at: string; }
export interface CourseProject { id: string; title: string; status: string; created_at: string; }
export interface GigSubmission { id: string; gig_id: string; talent_id: string; status: string; created_at: string; }
export interface GigVerification { id: string; talent_id: string; status: string; created_at: string; }
export interface WithdrawalRequest { id: string; talent_id: string; amount: number; status: string; created_at: string; }

export function useGigGraph() {
  const queryClient = useQueryClient();

  // 1. The Master Gig Graph Query
  const gigGraphQuery = useQuery({
    queryKey: ["gig_graph_master"],
    queryFn: async () => {
      const [gigsRes, marketRes, courseRes, subRes, verifRes, walletRes] = await Promise.all([
        supabase.from("gigs").select("id, title, status, reward_amount, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("marketplace_gigs").select("id, title, status, budget, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("course_projects").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("gig_submissions").select("id, gig_id, talent_id, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("gig_verifications").select("id, talent_id, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("withdrawal_requests").select("id, talent_id, amount, status, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      if (gigsRes.error) throw gigsRes.error;
      if (marketRes.error) throw marketRes.error;
      if (courseRes.error) throw courseRes.error;
      if (subRes.error) throw subRes.error;
      if (verifRes.error) throw verifRes.error;
      if (walletRes.error) throw walletRes.error;

      return {
        quickActions: gigsRes.data as GigNode[],
        marketplaceGigs: marketRes.data as MarketplaceGig[],
        courseProjects: courseRes.data as CourseProject[],
        submissions: subRes.data as GigSubmission[],
        verifications: verifRes.data as GigVerification[],
        withdrawals: walletRes.data as WithdrawalRequest[],
      };
    },
  });

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (payload.id) {
          const { error } = await supabase.from(table as any).update(payload).eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table as any).insert(payload);
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gig_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });
  };

  const createDeleteMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table as any).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gig_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    gigGraphQuery,
    mutations: {
      upsertQuickAction: createUpsertMutation("gigs", "Quick Action Gig"),
      deleteQuickAction: createDeleteMutation("gigs", "Quick Action Gig"),
      upsertMarketplaceGig: createUpsertMutation("marketplace_gigs", "Marketplace Gig"),
      deleteMarketplaceGig: createDeleteMutation("marketplace_gigs", "Marketplace Gig"),
      upsertCourseProject: createUpsertMutation("course_projects", "Course Project"),
      deleteCourseProject: createDeleteMutation("course_projects", "Course Project"),
      upsertSubmission: createUpsertMutation("gig_submissions", "Gig Submission"),
      deleteSubmission: createDeleteMutation("gig_submissions", "Gig Submission"),
      upsertVerification: createUpsertMutation("gig_verifications", "Verification Node"),
      deleteVerification: createDeleteMutation("gig_verifications", "Verification Node"),
      upsertWithdrawal: createUpsertMutation("withdrawal_requests", "Withdrawal Request"),
      deleteWithdrawal: createDeleteMutation("withdrawal_requests", "Withdrawal Request"),
    }
  };
}
