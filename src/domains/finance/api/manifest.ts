/**
 * Finance domain — barrel re-exporting typed edge wrappers (Phase 9g).
 * Legacy `financeApi` const removed.
 */
export {
  updateStripeSecret,
  processWithdrawal,
  createCheckout,
} from "./financeApi";

export type {
  UpdateStripeSecretRequest,
  UpdateStripeSecretResponse,
  ProcessWithdrawalRequest,
  ProcessWithdrawalResponse,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from "@/edge/contracts/finance";
