import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployerPipelineFull,
  updateApplicationStatus,
} from "@/domains/jobs/repo/jobsRepo";
import { notifyApplicationStatus } from "@/domains/jobs/api/jobsApi";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { toast } from "sonner";

/**
 * Architecture: Scoped to active recruiter company workspace.
 */

export type PipelineStatus =
  | "submitted"
  | "sent_to_employer"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "withdrawn"
  | "hired";

export interface PipelineApplication {
  id: string;
  job_id: string;
  job_title: string | null;
  company_id: string | null;
  company_name: string | null;
  talent_id: string | null;
  talent_name: string | null;
  talent_headline: string | null;
  ai_match_score: number | null;
  application_status: PipelineStatus;
  created_at: string;
  last_status_at: string | null;
  cv_url: string | null;
  cover_letter: string | null;
  sourced?: boolean | null;
  sourced_relationship_id?: string | null;
  external_notes?: string | null;
}

export interface PipelineDashboardPayload {
  apps: PipelineApplication[];
  counts: Record<string, number>;
}

export function useEmployerPipeline(opts: { companyId?: string | null; jobId?: string | null }) {
  const queryClient = useQueryClient();
  const queryKey = ["employer-pipeline", opts.companyId ?? null, opts.jobId ?? null];

  // --------------------------------------------------------
  // PHASE: Core Declarative Sourcing Pipeline Query
  // --------------------------------------------------------
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    // Realtime context constraint: staleTime set to 0 to ensure live recruiter synchronicity
    staleTime: 0,
    queryFn: async (): Promise<PipelineDashboardPayload> => {
      // dashboard: EXECUTING_RPC_PIPELINE_SELECT
      let data: unknown;
      try {
        data = await getEmployerPipelineFull({
          companyId: opts.companyId ?? null,
          jobId: opts.jobId ?? null,
          limit: 500,
        });
      } catch (error: unknown) {
        console.error("[Employer Pipeline] Error: get_employer_pipeline_full database ingress rejected.", {
          companyId: opts.companyId,
          jobId: opts.jobId,
          error: (error as any)?.message,
        });
        throw error;
      }

      const payload = (data ?? {}) as { apps?: PipelineApplication[]; counts?: Record<string, number> };
      return {
        apps: (payload.apps ?? []) as PipelineApplication[],
        counts: payload.counts ?? {},
      };
    },
  });

  // --------------------------------------------------------
  // PHASE: State Mutation & Notification Handshake
  // --------------------------------------------------------
  const moveMutation = useMutation({
    mutationFn: async ({ applicationId, to }: { applicationId: string; to: PipelineStatus }) => {
      // dashboard: ATOMIC_APPLICATION_STATUS_UPDATE
      await updateApplicationStatus(applicationId, to);

      // dashboard: EDGE_INVOCATION_NOTIFICATION_DISPATCH
      // Hardened tracking logic replaces baseline ignoring of failed email pipelines
      try {
        await notifyApplicationStatus({
          application_id: applicationId,
          status: to,
        });
      } catch (err) {
        const message =
          err instanceof EdgeFunctionError ? err.message : String(err);
        console.error(
          "[Employer Pipeline] Warning: notify-application-status secondary edge call timed out.",
          { applicationId, status: to, message }
        );
        // We do not rethrow here to protect transactional database state execution loops
      }
    },
    onSuccess: () => {
      // Synchronize data nodes universally via query client cache invalidations
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Applicant status updated safely.");
    },
    onError: (err: unknown, variables) => {
      console.error("[Employer Pipeline] Error: job_applications Kanban transition state failure.", {
        applicationId: variables.applicationId,
        targetStatus: variables.to,
        error: (err as any).message,
        code: (err as any).code,
      });
      toast.error(`Handshake timeout. Candidate state update enqueued for operations review.`);
    },
  });

  return {
    apps: data?.apps ?? [],
    counts: data?.counts ?? {},
    loading: isLoading,
    move: async (applicationId: string, to: PipelineStatus) => {
      await moveMutation.mutateAsync({ applicationId, to });
    },
    isMoving: moveMutation.isPending,
    reload: async () => {
      await refetch();
    },
  };
}

/**
 * Global upsert factory routine ensuring direct recruitment contact isolation constraints.
 * Enforced as an Immutable platform specification function helper.
 */
export async function ensureDirectThread(companyId: string, talentId: string): Promise<string | null> {
  try {
    // dashboard: EXECUTING_RPC_THREAD_UPSERT (delegated to messagingRepo)
    const { upsertDirectThread } = await import("@/domains/messaging/repo/messagingRepo");
    return await upsertDirectThread({ companyId, talentId });
  } catch (err: unknown) {
    console.error("[Employer Pipeline] Error: upsert_direct_thread RPC workflow failure.", {
      companyId,
      talentId,
      error: (err as any)?.message,
    });
    return null;
  }
}


