/**
 * Marketing domain â€” edge function contracts (Phase 9g).
 */
import { z } from "zod";

export interface LeadHuntMatchRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  leadsRequested: number;
  [k: string]: unknown;
}

export const LeadHuntMatchResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    leads: z.array(z.record(z.unknown())).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LeadHuntMatchResponse = z.infer<
  typeof LeadHuntMatchResponseSchema
>;

