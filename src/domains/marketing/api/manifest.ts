/**
 * Marketing domain — barrel re-exporting typed edge wrappers (Phase 9g).
 * Legacy `marketingApi` const removed.
 */
export { leadHuntMatch } from "./marketingApi";
export type {
  LeadHuntMatchRequest,
  LeadHuntMatchResponse,
} from "@/edge/contracts/marketing";
