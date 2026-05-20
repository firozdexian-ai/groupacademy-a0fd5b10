import { supabase } from "@/integrations/supabase/client";
import type {
  LeadHuntMatchRequest,
  LeadHuntMatchResponse,
} from "@/edge/contracts/marketing";

export const marketingApi = {
  async leadHuntMatch(body: LeadHuntMatchRequest) {
    const { data, error } = await supabase.functions.invoke<LeadHuntMatchResponse>(
      "lead-hunt-match",
      { body },
    );
    return { data, error };
  },
} as const;

export type MarketingApi = typeof marketingApi;
