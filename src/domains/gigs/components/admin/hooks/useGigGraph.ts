import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getGigGraphSlice,
  upsertGigGraphRow,
  deleteGigGraphRow,
  type GigGraphTable,
} from "@/domains/gigs/repo/gigsRepo";

export interface GigNode { id: string; title: string; status: string; reward_amount: number; created_at: string; }
export interface MarketplaceGig { id: string; title: string; status: string; budget: number; created_at: string; }
export interface CourseProject { id: string; title: string; status: string; created_at: string; }
export interface GigSubmission { id: string; gig_id: string; talent_id: string; status: string; created_at: string; }
export interface GigVerification { id: string; talent_id: string; status: string; created_at: string; }
export interface WithdrawalRequest { id: string; talent_id: string; amount: number; status: string; created_at: string; }

export function useGigGraph() {
  const queryClient = useQueryClient();

  const gigGraphQuery = useQuery({
    queryKey: ["gig_graph_master"],
    queryFn: async () => {
      const slice = await getGigGraphSlice();
      return {
        quickActions: slice.gigs.map((g: any) => ({
          ...g,
          status: g.status ? "active" : "inactive",
        })) as GigNode[],
        marketplaceGigs: slice.marketplaceGigs as unknown as MarketplaceGig[],
        courseProjects: slice.courseProjects.map((c: any) => ({
          id: c.id,
          title: c.course?.title ?? "Untitled Project",
          status: c.status,
          created_at: c.created_at,
        })) as CourseProject[],
        submissions: slice.submissions as unknown as GigSubmission[],
        verifications: slice.verifications as unknown as GigVerification[],
        withdrawals: slice.withdrawals as unknown as WithdrawalRequest[],
      };
    },
  });

  const mapPayloadForDb = (table: GigGraphTable, payload: any) => {
    const cleanPayload: any = {};
    if (payload.id) cleanPayload.id = payload.id;

    if (table === "gigs") {
      cleanPayload.title = payload.title;
      if (payload.reward_amount !== undefined) cleanPayload.credit_reward = Number(payload.reward_amount);
      if (payload.status !== undefined) cleanPayload.is_active = payload.status === "active";
    } else if (table === "marketplace_gigs") {
      cleanPayload.title = payload.title;
      cleanPayload.status = payload.status;
      if (payload.budget !== undefined) cleanPayload.budget_amount = Number(payload.budget);
    } else if (table === "course_projects") {
      cleanPayload.status = payload.status;
      if (payload.course_id !== undefined) cleanPayload.course_id = payload.course_id;
    } else if (table === "gig_submissions") {
      cleanPayload.gig_id = payload.gig_id;
      cleanPayload.talent_id = payload.talent_id;
      cleanPayload.status = payload.status;
    } else if (table === "gig_verifications") {
      cleanPayload.talent_id = payload.talent_id;
      cleanPayload.verdict = payload.status;
    } else if (table === "withdrawal_requests") {
      cleanPayload.talent_id = payload.talent_id;
      if (payload.amount !== undefined) cleanPayload.amount_credits = Number(payload.amount);
      cleanPayload.status = payload.status;
    }
    return cleanPayload;
  };

  const createUpsertMutation = (table: GigGraphTable, entityName: string) =>
    useMutation({
      mutationFn: async (payload: any) => {
        const dbPayload = mapPayloadForDb(table, payload);
        await upsertGigGraphRow(table, dbPayload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gig_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });

  const createDeleteMutation = (table: GigGraphTable, entityName: string) =>
    useMutation({
      mutationFn: async (id: string) => {
        await deleteGigGraphRow(table, id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gig_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });

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
    },
  };
}
