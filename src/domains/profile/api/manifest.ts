/**
 * Profile domain — barrel re-exporting typed edge wrappers (Phase 9g).
 * Legacy `profileApi` const removed. `parse-cv` belongs to jobs domain —
 * import from `@/domains/jobs/api/jobsApi`.
 */
export { claimPublicHandle } from "./profileApi";
export type {
  ClaimPublicHandleRequest,
  ClaimPublicHandleResponse,
} from "@/edge/contracts/profile";

