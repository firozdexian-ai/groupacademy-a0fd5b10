/**
 * Host detection — switches the same React build between two PWAs:
 *  • GroUp Academy (talent-facing) on groupacademy.online + lovable previews
 *  • Gro10x (B2B professional super-app) on gro10x.* hosts
 *
 * Override locally with ?gro10x=1 (sticky via localStorage) for testing.
 */

const STORAGE_KEY = "gro10x:host-override";

function detect(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  const search = window.location.search;

  // Sticky override
  try {
    if (search.includes("gro10x=1")) {
      localStorage.setItem(STORAGE_KEY, "1");
    } else if (search.includes("gro10x=0")) {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (localStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch {
    /* SSR or storage disabled */
  }

  // Production hosts
  if (host.startsWith("gro10x.") || host.includes(".gro10x.")) return true;
  if (host === "gro10x.app" || host === "app.gro10x.com") return true;

  return false;
}

export const IS_GRO10X: boolean = detect();

export const APP_NAME = IS_GRO10X ? "Gro10x" : "GroUp Academy";
export const APP_TAGLINE = IS_GRO10X
  ? "Professional AI agents, in one inbox."
  : "Decode your career potential with AI.";
