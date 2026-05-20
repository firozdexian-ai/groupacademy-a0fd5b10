/**
 * Messaging domain — edge function contracts (Phase 9g).
 */
import { z } from "zod";

export type UnipileAction =
  | "start_hosted_auth"
  | "verify_and_save"
  | "delete"
  | "reconcile";

export interface UnipileConnectRequest {
  action: UnipileAction;
  agent_key: string;
  label?: string;
  region?: string;
  provider?: "whatsapp" | "telegram";
  account_id?: string;
  [key: string]: unknown;
}

export const UnipileConnectResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    url: z.string().optional(),
    channel_id: z.string().optional(),
    phone: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type UnipileConnectResponse = z.infer<
  typeof UnipileConnectResponseSchema
>;
