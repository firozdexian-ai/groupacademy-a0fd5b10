/**
 * Gigs domain — edge function contracts (Phase 9g).
 *
 * Only `ai-bid-coach` is owned by gigs. The other gig-adjacent functions
 * (`parse-job-post`, `generate-job-share-caption`) are owned by jobs;
 * `generate-outreach-message` is owned by talent. Call sites should import
 * those wrappers from the owner domain directly.
 */
import { z } from "zod";

export interface AiBidCoachRequest {
  gig_id: string;
  gig_kind?: string;
  draft_text: string;
  [k: string]: unknown;
}

export const AiBidCoachResponseSchema = z
  .object({
    suggestions: z.array(z.string()).optional(),
    improved: z.string().optional(),
    rationale: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiBidCoachResponse = z.infer<typeof AiBidCoachResponseSchema>;
