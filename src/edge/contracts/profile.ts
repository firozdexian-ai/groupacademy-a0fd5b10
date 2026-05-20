/**
 * Profile domain — edge function contracts (Phase 9g).
 *
 * Only `claim-public-handle` is owned by profile. `parse-cv` is owned by
 * jobs — see `src/domains/jobs/api/jobsApi.ts` and import from there.
 */
import { z } from "zod";

export interface ClaimPublicHandleRequest {
  handle: string;
  is_public?: boolean;
  [k: string]: unknown;
}

export const ClaimPublicHandleResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    handle: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type ClaimPublicHandleResponse = z.infer<
  typeof ClaimPublicHandleResponseSchema
>;
