import { useEffect, useMemo, useState } from "react";

/**
 * GroUp Academy: Perceptual Latency guard (V5.6.0)
 * CTO Reference: Authoritative hook for dynamic loading states and UX continuity.
 * Architecture: Reference-isolated parameters preventing accidental timer clearing.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Variant).
 */

export type ProgressiveLoadingMessageOptions = {
  /** Thresholds defined in monotonic seconds */
  thresholds?: {
    connecting?: number;
    long?: number;
    veryLong?: number;
  };
};

/**
 * Tracks loading time and returns contextual messages to keep users engaged.
 * Hardened against parent component re-render reference shifts.
 */
export function useProgressiveLoadingMessage(active: boolean, options?: ProgressiveLoadingMessageOptions) {
  // Extract configuration fields to primitive values to avoid object reference traps
  const connectingThreshold = options?.thresholds?.connecting ?? 5;
  const longThreshold = options?.thresholds?.long ?? 15;
  const veryLongThreshold = options?.thresholds?.veryLong ?? 30;

  const [seconds, setSeconds] = useState(0);

  // --------------------------------------------------------
  // PHASE 1: Temporal Lifecycle Management
  // --------------------------------------------------------
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }

    setSeconds(0);

    // dashboard: INITIALIZE_MONOTONIC_INTERVAL_INCREMENTOR
    const intervalId = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [active]); // Securely runs on primitive flags to avoid unbinding cycles

  // --------------------------------------------------------
  // PHASE 2: Semantic Message Derivation
  // --------------------------------------------------------
  const message = useMemo(() => {
    // dashboard: TELEMETRY_WARNING_TRIGGER
    if (seconds === veryLongThreshold) {
      console.warn(
        `[Digital Workforce] ANOMALY: Progressive loader exceeded maximum safety threshold (${veryLongThreshold}s). Inspect underlying network transport layer.`,
      );
    }

    if (seconds < connectingThreshold) {
      return "Initializing trajectory…";
    }
    if (seconds < longThreshold) {
      return "Connecting to neural server…";
    }
    if (seconds < veryLongThreshold) {
      return "Optimizing connection (this may take a moment)…";
    }

    return "Finalizing handshake… almost there.";
  }, [seconds, connectingThreshold, longThreshold, veryLongThreshold]);

  return { seconds, message };
}

