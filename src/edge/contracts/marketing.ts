/**
 * Marketing domain — edge function contracts.
 */
export interface LeadHuntMatchRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  leadsRequested: number;
}

export type LeadHuntMatchResponse = Record<string, unknown>;
