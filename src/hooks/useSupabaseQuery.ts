import { useState, useCallback, useRef, useEffect } from "react";

/**
 * GroUp Academy: Neural Database Sentinel
 * CTO Reference: Authoritative controller for aborted and timed-out database ingress.
 * Performance: Implements native AbortSignal propagation to severance network connections.
 */

interface UseSupabaseQueryOptions<T> {
  timeout?: number;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isTimeout: boolean;
  execute: () => Promise<T | null>;
  abort: () => void;
}

export function useSupabaseQuery<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  options: UseSupabaseQueryOptions<T> = {},
): UseSupabaseQueryResult<T> {
  const { timeout = 15000, onError, onTimeout } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PHASE: Transmission_Severance_Protocol
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // PHASE: Neural_Execute_Node
  const execute = useCallback(async (): Promise<T | null> => {
    // ABORT: Clear previous transmission artifacts
    abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setIsTimeout(false);

    // HUD: LATENCY_THRESHOLD_TIMER
    timeoutIdRef.current = setTimeout(() => {
      controller.abort();
      setIsTimeout(true);
      setLoading(false);
      const tErr = new Error(`THRESHOLD_ERROR: Request timed out after ${timeout / 1000}s`);
      setError(tErr);
      onTimeout?.();
    }, timeout);

    try {
      const result = await queryFn(controller.signal);

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // IDENTITY_CHECK: Ensure artifact still belongs to active controller
      if (!controller.signal.aborted) {
        setData(result);
        setLoading(false);
        return result;
      }
    } catch (err) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      if (err instanceof Error && err.name === "AbortError") {
        // Handle as timeout or manual cancel
        return null;
      }

      if (!controller.signal.aborted) {
        const errorArtifact = err instanceof Error ? err : new Error("UNKNOWN_REGISTRY_FAULT");
        setError(errorArtifact);
        setLoading(false);
        onError?.(errorArtifact);
      }
    }

    return null;
  }, [queryFn, timeout, abort, onError, onTimeout]);

  useEffect(() => {
    return () => abort();
  }, [abort]);

  return { data, loading, error, isTimeout, execute, abort };
}

/**
 * Utility: Procedural execution with hard-stop timeout.
 */
export async function executeWithAbort<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 15000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await queryFn(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`RACE_TIMEOUT: Threshold reached (${timeoutMs / 1000}s)`);
    }
    throw err;
  }
}

/**
 * Diagnostic: Verify if artifact is a latency/abort event.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "AbortError" || error.message.includes("timed out");
  }
  return false;
}
