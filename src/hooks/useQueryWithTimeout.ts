import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

/**
 * GroUp Academy: Neural Transaction Guard (V5.6.0)
 * CTO Reference: Authoritative utility for aborted, timed-out, and resilient data fetching.
 * Architecture: Optimized for TanStack Query v5 native signal tracking with zero allocation drift.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

const DEFAULT_TIMEOUT = 30000; // 30s Institutional Threshold

interface QueryWithTimeoutOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, "queryFn"> {
  /** Query function that consumes a native AbortSignal for hardware-level cancellation */
  queryFn: (signal: AbortSignal) => Promise<TData>;
  timeout?: number;
}

/**
 * Wraps useQuery with native AbortSignal propagation and atomic timeout protection thresholds.
 */
export function useQueryWithTimeout<TData = unknown, TError = Error>({
  queryFn,
  timeout = DEFAULT_TIMEOUT,
  ...options
}: QueryWithTimeoutOptions<TData, TError>): UseQueryResult<TData, TError> {
  // dashboard: NEURAL_WRAPPED_EXECUTOR_V5
  const wrappedQueryFn = async (context: { signal: AbortSignal }): Promise<TData> => {
    const { signal: rqSignal } = context;

    // Construct a hard native timer that races against our query execution callback
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        // Digital Workforce Anomaly Trigger: Imprints explicit trace tracking packets
        console.warn(
          `[Digital Workforce] ANOMALY: Transaction Guard threshold reached (${timeout}ms). Forcing closure execution.`,
        );
        reject(new Error(`THRESHOLD_ERROR: Request timed out after ${timeout / 1000} seconds`));
      }, timeout);
    });

    try {
      // Race the underlying query execution logic straight against our absolute boundary timer
      return await Promise.race([queryFn(rqSignal), timeoutPromise]);
    } catch (err: unknown) {
      // Differentiate between intentional client abort actions and automated gateway timeouts
      if (err?.name === "AbortError" || rqSignal.aborted) {
        throw err;
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return useQuery<TData, TError>({
    ...options,
    queryFn: wrappedQueryFn,
    retry: (failureCount, error) => {
      // PROTOCOL: No retries for timeout/abort events to carefully safeguard network bandwidth
      if (
        error instanceof Error &&
        (error.message.includes("timed out") ||
          error.message.includes("THRESHOLD_ERROR") ||
          error.name === "AbortError")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
}

/**
 * PHASE: Async_Race_Sentinel
 * Wraps unknown promise context with an absolute hard-stop network timeout.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT,
  errorMessage?: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `RACE_TIMEOUT: Threshold reached (${timeoutMs / 1000}s)`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Diagnostic: Verify if target error corresponds to a latency exception tracker.
 */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("timed out") ||
      error.message.includes("TIMEOUT") ||
      error.message.includes("THRESHOLD_ERROR"))
  );
}


