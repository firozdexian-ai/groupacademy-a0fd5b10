/**
 * Typed request/response contracts for gigs-domain edge functions.
 */

// ai-bid-coach
export interface AiBidCoachRequest {
  gigId: string;
  draft?: string;
  context?: Record<string, unknown>;
}
export interface AiBidCoachResponse {
  suggestions?: string[];
  improved?: string;
  rationale?: string;
  error?: string;
}

// generate-outreach-message
export interface GenerateOutreachMessageRequest {
  context: Record<string, unknown>;
  channel?: "email" | "linkedin" | "whatsapp";
}
export interface GenerateOutreachMessageResponse {
  message?: string;
  subject?: string;
  error?: string;
}

// parse-job-post
export interface ParseJobPostRequest {
  rawText?: string;
  url?: string;
}
export interface ParseJobPostResponse {
  success?: boolean;
  parsed?: Record<string, unknown>;
  error?: string;
}

// generate-job-share-caption
export interface GenerateJobShareCaptionRequest {
  jobId: string;
  tone?: string;
}
export interface GenerateJobShareCaptionResponse {
  caption?: string;
  hashtags?: string[];
  error?: string;
}
