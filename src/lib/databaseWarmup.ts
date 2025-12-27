import { supabase } from "@/integrations/supabase/client";
import { TIMEOUTS } from "@/lib/timeoutConfig";

let warmupPromise: Promise<void> | null = null;

// Strict max duration for warmup - always resolves within this time
const WARMUP_MAX_MS = 8_000;

/**
 * Warms up the backend connection to reduce first-request cold-start time.
 * Safe to call multiple times; only the first call will do work.
 * Guaranteed to resolve within WARMUP_MAX_MS (best-effort, never hangs).
 */
export function warmupDatabase(): Promise<void> {
  if (warmupPromise) return warmupPromise;

  console.log("[Warmup] Starting database warmup...");
  const startTime = Date.now();

  warmupPromise = new Promise<void>((resolve) => {
    const controller = new AbortController();
    
    // Hard timeout that always resolves
    const hardTimeout = setTimeout(() => {
      console.warn(`[Warmup] Hard timeout reached after ${WARMUP_MAX_MS}ms`);
      controller.abort();
      resolve();
    }, WARMUP_MAX_MS);

    // Soft timeout from config
    const softTimeout = setTimeout(() => {
      console.warn(`[Warmup] Soft timeout reached after ${TIMEOUTS.COLD_START}ms`);
      controller.abort();
    }, TIMEOUTS.COLD_START);

    // Perform the warmup query
    const query = supabase
      .from("profession_categories")
      .select("id")
      .limit(1)
      .abortSignal(controller.signal);

    Promise.resolve(query)
      .then(() => {
        console.log(`[Warmup] Database ready in ${Date.now() - startTime}ms`);
      })
      .catch((error: unknown) => {
        // Best-effort only - log but don't fail
        const err = error as { name?: string; message?: string };
        if (err?.name !== "AbortError") {
          console.warn("[Warmup] Warmup query failed:", err?.message || error);
        }
      })
      .finally(() => {
        clearTimeout(hardTimeout);
        clearTimeout(softTimeout);
        resolve();
      });
  });

  return warmupPromise;
}

export function resetWarmupForDebug() {
  warmupPromise = null;
}
