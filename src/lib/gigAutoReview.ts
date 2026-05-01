import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget invocation of the autonomous gig review pipeline.
 * Called immediately after a `gig_submissions` row is created so the
 * platform can approve / reject / escalate without manual admin work.
 */
export async function triggerAutoReview(submissionId: string): Promise<void> {
  if (!submissionId) return;
  try {
    await supabase.functions.invoke("auto-review-gig-submission", {
      body: { submission_id: submissionId },
    });
  } catch (err) {
    // Silent: edge function failure should never block the talent UX.
    console.warn("[auto-review] invocation failed", err);
  }
}
