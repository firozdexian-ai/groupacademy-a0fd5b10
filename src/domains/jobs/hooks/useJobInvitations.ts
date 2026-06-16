import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { notifyHiringEvent } from "@/domains/jobs/api/jobsApi";
import { insertJobInvitation } from "@/domains/jobs/repo/jobsRepo";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

/**
 * Architecture: Scoped to active recruiter company workspace.
 */

export interface InviteToApplyInput {
  job_id: string;
  company_id: string;
  talent_id: string;
  note?: string;
}

/**
 * Manages the "Invite to Apply" transaction.
 * Leverages TanStack Mutations to prevent double-submissions and manage state.
 */
export function useInviteToApply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteToApplyInput): Promise<string> => {
      const user = await getCurrentUser();
      if (!user) throw new Error("AUTH_REQUIRED: Please sign in to invite talent.");

      // Check if candidate is already invited to this job
      const { data: existing, error: checkError } = await supabase
        .from("job_invitations")
        .select("id")
        .eq("job_id", input.job_id)
        .eq("talent_id", input.talent_id)
        .in("status", ["pending", "sent"])
        .maybeSingle();

      if (checkError) {
        console.error("Failed to check duplicate invitations:", checkError);
      }
      if (existing) {
        throw new Error("Candidate has already been invited to this job.");
      }

      // dashboard: EXECUTING_JOB_INVITATION_INSERT
      let data: { id: string };
      try {
        data = await insertJobInvitation({
          job_id: input.job_id,
          company_id: input.company_id,
          talent_id: input.talent_id,
          note: input.note ?? null,
          invited_by: user.id,
        });
      } catch (error: unknown) {
        console.error("[Job Invitations] Error: job_invitations insert failed.", error);
        throw error;
      }


      // dashboard: EDGE_INVOCATION_NOTIFICATION_HANDSHAKE
      try {
        await notifyHiringEvent({
          kind: "job_invitation",
          ref: { invitation_id: data.id },
        });
      } catch (err) {
        // We log this but don't fail the mutation, as the record was saved.
        const message =
          err instanceof EdgeFunctionError ? err.message : String(err);
        console.error(
          "[Job Invitations] Warning: notify-hiring-event failed for job_invitation.",
          { invitation_id: data.id, message }
        );
      }

      return data.id;
    },
    onSuccess: () => {
      // Invalidate sourcing caches to show the "Invited" status on candidate cards
      queryClient.invalidateQueries({ queryKey: ["talent-search"] });
      queryClient.invalidateQueries({ queryKey: ["employer-pipeline"] });
      toast.success("Invitation sent to candidate.");
    },
    onError: (err: unknown) => {
      toast.error(err.message ?? "Failed to send invitation. Handshake timeout.");
    },
  });
}


