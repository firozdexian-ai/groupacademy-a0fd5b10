/**
 * Analytics domain — barrel re-exporting typed edge wrappers (Phase 9g).
 * Legacy `analyticsApi` const removed.
 */
export { adminReportBuilder } from "./analyticsApi";
export type {
  AdminReportBuilderRequest,
  AdminReportBuilderResponse,
} from "@/edge/contracts/analytics";
