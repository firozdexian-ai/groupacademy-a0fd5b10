/**
 * GroUp Academy: Neural Exception Sentinel
 * CTO Reference: Authoritative utility for graceful AI service degradation.
 * Logic: Implements bimodal diagnostic mapping and talent-friendly suggestions.
 */

export interface AIErrorResult {
  message: string;
  suggestion?: string;
  isAIUnavailable: boolean;
}

/**
 * PHASE: Semantic_Error_Translation
 * Transforms raw service faults into pedagogical suggestions.
 */
export function handleAIError(error: any, statusCode?: number): AIErrorResult {
  const errorMessage = error?.message?.toLowerCase() || "";

  // HUD: Fiscal_Quota_Audit (402 Payment Required)
  if (
    statusCode === 402 ||
    errorMessage.includes("quota") ||
    errorMessage.includes("payment_required") ||
    errorMessage.includes("not enough credits")
  ) {
    return {
      message: "AI trajectory optimization is temporarily unavailable.",
      suggestion: "Please proceed with manual entry or check your credit ledger.",
      isAIUnavailable: true,
    };
  }

  // HUD: Concurrency_Backoff (429 Too Many Requests)
  if (statusCode === 429 || errorMessage.includes("rate limit")) {
    return {
      message: "High neural traffic detected.",
      suggestion: "Please re-attempt the handshake in a few seconds.",
      isAIUnavailable: false,
    };
  }

  // HUD: Latency_Threshold_Fault
  if (errorMessage.includes("timeout") || error?.name === "AbortError") {
    return {
      message: "Neural handshake timed out.",
      suggestion: "Please try again or utilize the manual curriculum process.",
      isAIUnavailable: false,
    };
  }

  // HUD: Institutional_Infrastructure_Fault (5xx)
  if (statusCode && statusCode >= 500 && statusCode <= 504) {
    return {
      message: "AI services are currently undergoing maintenance.",
      suggestion: "Manual workflows remain active. Please check back later.",
      isAIUnavailable: true,
    };
  }

  // HUD: Network_Ingress_Issue
  if (errorMessage.includes("network") || errorMessage.includes("failed to fetch")) {
    return {
      message: "Network transmission fault.",
      suggestion: "Verify your connection artifacts and re-sync.",
      isAIUnavailable: false,
    };
  }

  // HUD: Default_Fallback_Protocol
  return {
    message: error?.message || "An unexpected neural fault occurred.",
    suggestion: "System suggests a manual retry.",
    isAIUnavailable: false,
  };
}

/**
 * Diagnostic: Semantic toast artifacts for AI-hard-stops.
 */
export function getAIUnavailableToast(): { title: string; description: string } {
  return {
    title: "AI Node Offline",
    description: "Neural services are currently unreachable. Please proceed with manual curriculum tasks.",
  };
}

/**
 * Logic: Verify if status artifact indicates service unavailability.
 */
export function isAIServiceError(response: Response | null): boolean {
  if (!response) return false;
  return response.status === 402 || response.status === 429 || response.status >= 500;
}
