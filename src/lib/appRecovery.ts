/**
 * GroUp Academy: Institutional Resilience & Recovery Sentinel
 * CTO Reference: Authoritative fail-safe for cache, chunk, and BFCache restoration.
 * Performance: Implements atomic reloads with search-param cache busting.
 */

const RECOVERY_FLAG = "__app_recovered_once";
const RECOVERY_COOLDOWN_MS = 10000; // 10s Cooldown Threshold

/**
 * HUD: RECOVERY_THROTTLE_CHECK
 * Logic: Prevents recursive reload loops within the monotonic window.
 */
function isInRecoveryCooldown(): boolean {
  const lastRecovery = sessionStorage.getItem(RECOVERY_FLAG);
  if (!lastRecovery) return false;

  const elapsed = Date.now() - parseInt(lastRecovery, 10);
  return elapsed < RECOVERY_COOLDOWN_MS;
}

function markRecoveryAttempt(): void {
  sessionStorage.setItem(RECOVERY_FLAG, Date.now().toString());
}

/**
 * PHASE: Cache_Bust_Reload
 * Forces a hardware-level refresh using temporal search parameters.
 */
export function reloadWithCacheBust(reason: string): void {
  if (isInRecoveryCooldown()) {
    console.warn(`[Sentinel] RECOVERY_THROTTLE: Skipping reload. Reason: ${reason}`);
    return;
  }

  console.error(`[Sentinel] TRIGGER_RELOAD: Fault detected (${reason})`);
  markRecoveryAttempt();

  const url = new URL(window.location.href);
  url.searchParams.set("_cb", Date.now().toString());

  // HUD: Atomic replacement to preserve history integrity
  window.location.replace(url.toString());
}

/**
 * PHASE: Session_Registry_Purge
 * Clears institutional auth artifacts when session corruption is detected.
 */
export function resetSessionAndReload(): void {
  console.error("[Sentinel] SESSION_RESET: Purging auth artifacts...");

  const clearRegistry = (storage: Storage) => {
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        keys.push(key);
      }
    }
    keys.forEach((k) => storage.removeItem(k));
  };

  clearRegistry(localStorage);
  clearRegistry(sessionStorage);

  reloadWithCacheBust("manual_session_reset");
}

/**
 * PHASE: Error_Pattern_Audit
 * Diagnostic logic for detecting dynamic module failures.
 */
function isChunkLoadError(message: string): boolean {
  const patterns = [
    "Loading chunk",
    "Failed to fetch dynamically imported module",
    "Unexpected token '<'", // Server-side 404/500 HTML return
    "error loading dynamically imported module",
    "Unable to preload CSS",
  ];
  return patterns.some((p) => message.toLowerCase().includes(p.toLowerCase()));
}

/**
 * HUD: Institutional Error Handlers
 */
export function installChunkErrorHandlers(): void {
  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.message || "")) {
      event.preventDefault();
      reloadWithCacheBust(`chunk_error: ${event.message.slice(0, 50)}`);
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || event.reason?.toString() || "";
    if (isChunkLoadError(msg)) {
      event.preventDefault();
      reloadWithCacheBust(`chunk_rejection: ${msg.slice(0, 50)}`);
    }
  });
}

/**
 * HUD: BFCache Restoration Sentinel
 */
export function installBFCacheHandler(): void {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.warn("[Sentinel] BFCACHE_DETECTED: Forcing state refresh...");
      reloadWithCacheBust("bfcache_restore");
    }
  });
}

/**
 * Initialization: Activate all resilience nodes.
 */
export function initializeAppRecovery(): void {
  installChunkErrorHandlers();
  installBFCacheHandler();
}
