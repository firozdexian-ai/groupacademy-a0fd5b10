/**
 * App Recovery Utilities
 * Handles automatic recovery from stale cache, chunk load failures, and BFCache issues.
 */

const RECOVERY_FLAG = "__app_recovered_once";
const RECOVERY_COOLDOWN_MS = 10_000; // 10 seconds cooldown between recovery attempts

/**
 * Checks if we're in a recovery cooldown period to prevent infinite reload loops.
 */
function isInRecoveryCooldown(): boolean {
  const lastRecovery = sessionStorage.getItem(RECOVERY_FLAG);
  if (!lastRecovery) return false;
  
  const elapsed = Date.now() - parseInt(lastRecovery, 10);
  return elapsed < RECOVERY_COOLDOWN_MS;
}

/**
 * Marks that a recovery reload just happened.
 */
function markRecoveryAttempt(): void {
  sessionStorage.setItem(RECOVERY_FLAG, Date.now().toString());
}

/**
 * Force a fresh page load with cache-busting query parameter.
 * This ensures the browser fetches fresh HTML/JS instead of using stale cache.
 */
export function reloadWithCacheBust(reason: string): void {
  if (isInRecoveryCooldown()) {
    console.warn(`[AppRecovery] Skipping reload (cooldown active). Reason: ${reason}`);
    return;
  }

  console.error(`[AppRecovery] Triggering cache-bust reload. Reason: ${reason}`);
  markRecoveryAttempt();

  // Build a fresh URL with cache-busting parameter
  const url = new URL(window.location.href);
  url.searchParams.set("_cb", Date.now().toString());
  
  // Use replace to avoid polluting browser history
  window.location.replace(url.toString());
}

/**
 * Clears auth-related state and reloads the page.
 * Useful when Supabase auth state is corrupted.
 */
export function resetSessionAndReload(): void {
  console.error("[AppRecovery] Resetting session and reloading...");
  
  // Clear Supabase auth tokens from localStorage
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  
  // Also clear sessionStorage auth data
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      sessionKeysToRemove.push(key);
    }
  }
  sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

  reloadWithCacheBust("session_reset");
}

/**
 * Detects common chunk/module load failures and triggers recovery.
 */
function isChunkLoadError(message: string): boolean {
  const patterns = [
    "Loading chunk",
    "Failed to fetch dynamically imported module",
    "Unexpected token '<'", // HTML returned instead of JS
    "Unexpected token '<'",
    "error loading dynamically imported module",
    "Unable to preload CSS",
  ];
  
  return patterns.some((p) => message.toLowerCase().includes(p.toLowerCase()));
}

/**
 * Install global error handlers to detect and recover from chunk load failures.
 * Should be called once during app initialization.
 */
export function installChunkErrorHandlers(): void {
  // Handle synchronous errors
  window.addEventListener("error", (event) => {
    const message = event.message || "";
    if (isChunkLoadError(message)) {
      event.preventDefault();
      reloadWithCacheBust(`chunk_error: ${message.slice(0, 100)}`);
    }
  });

  // Handle promise rejections (dynamic imports fail as unhandled rejections)
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.toString() || "";
    
    if (isChunkLoadError(message)) {
      event.preventDefault();
      reloadWithCacheBust(`chunk_rejection: ${message.slice(0, 100)}`);
    }
  });

  console.log("[AppRecovery] Chunk error handlers installed");
}

/**
 * Handle BFCache (back-forward cache) restoration.
 * When a page is restored from BFCache, React/Supabase state can be stale.
 */
export function installBFCacheHandler(): void {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.warn("[AppRecovery] Page restored from BFCache, forcing reload...");
      reloadWithCacheBust("bfcache_restore");
    }
  });

  console.log("[AppRecovery] BFCache handler installed");
}

/**
 * Initialize all recovery mechanisms.
 * Call this early in the app bootstrap process.
 */
export function initializeAppRecovery(): void {
  console.log("[AppRecovery] Initializing recovery mechanisms...");
  installChunkErrorHandlers();
  installBFCacheHandler();
}
