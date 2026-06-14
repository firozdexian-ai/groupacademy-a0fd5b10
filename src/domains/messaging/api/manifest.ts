/**
 * Messaging domain â€” barrel re-exporting typed edge wrappers (Phase 9g).
 * Legacy `messagingApi` const removed.
 */
export { unipileConnect } from "./messagingApi";
export type {
  UnipileConnectRequest,
  UnipileConnectResponse,
  UnipileAction,
} from "@/edge/contracts/messaging";

