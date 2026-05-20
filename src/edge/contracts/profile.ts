/**
 * Typed request/response contracts for profile-domain edge functions.
 */

// claim-public-handle
export interface ClaimPublicHandleRequest {
  handle: string;
  is_public?: boolean;
}
export interface ClaimPublicHandleResponse {
  ok: boolean;
  handle?: string;
  error?: string;
}

// parse-cv
export interface ParseCvRequest {
  cvUrl: string;
}
export interface ParseCvResponse {
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
