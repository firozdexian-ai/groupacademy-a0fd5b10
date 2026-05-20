/**
 * Profile domain API manifest. Typed wrappers around supabase.functions.invoke
 * for every profile-owned edge function.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  ClaimPublicHandleRequest,
  ClaimPublicHandleResponse,
  ParseCvRequest,
  ParseCvResponse,
} from "@/edge/contracts/profile";

async function invoke<TReq, TRes>(fn: string, body: TReq): Promise<TRes> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  return data as TRes;
}

export const profileApi = {
  claimPublicHandle: (body: ClaimPublicHandleRequest) =>
    invoke<ClaimPublicHandleRequest, ClaimPublicHandleResponse>("claim-public-handle", body),
  parseCv: (body: ParseCvRequest) =>
    invoke<ParseCvRequest, ParseCvResponse>("parse-cv", body),
};

export type ProfileApi = typeof profileApi;
