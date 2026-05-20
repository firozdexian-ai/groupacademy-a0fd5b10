/**
 * Gigs domain — barrel re-exporting typed edge wrappers (Phase 9g).
 * Legacy `gigsApi` const removed.
 */
export { aiBidCoach } from "./gigsApi";
export type {
  AiBidCoachRequest,
  AiBidCoachResponse,
} from "@/edge/contracts/gigs";
