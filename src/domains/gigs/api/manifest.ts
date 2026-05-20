/**
 * Gigs domain API manifest. Typed wrappers around supabase.functions.invoke.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AiBidCoachRequest,
  AiBidCoachResponse,
  GenerateOutreachMessageRequest,
  GenerateOutreachMessageResponse,
  ParseJobPostRequest,
  ParseJobPostResponse,
  GenerateJobShareCaptionRequest,
  GenerateJobShareCaptionResponse,
} from "@/edge/contracts/gigs";

async function invoke<TReq, TRes>(fn: string, body: TReq): Promise<TRes> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  return data as TRes;
}

export const gigsApi = {
  aiBidCoach: (body: AiBidCoachRequest) =>
    invoke<AiBidCoachRequest, AiBidCoachResponse>("ai-bid-coach", body),
  generateOutreachMessage: (body: GenerateOutreachMessageRequest) =>
    invoke<GenerateOutreachMessageRequest, GenerateOutreachMessageResponse>("generate-outreach-message", body),
  parseJobPost: (body: ParseJobPostRequest) =>
    invoke<ParseJobPostRequest, ParseJobPostResponse>("parse-job-post", body),
  generateJobShareCaption: (body: GenerateJobShareCaptionRequest) =>
    invoke<GenerateJobShareCaptionRequest, GenerateJobShareCaptionResponse>("generate-job-share-caption", body),
};

export type GigsApi = typeof gigsApi;
