/**
 * Account-type-aware post-auth routing.
 * Used by Index, Auth pages, and Gro10x signup so each user type lands in
 * the right surface (talent feed, Gro10x B2B inbox, or admin dashboard).
 */
export type AccountType = "company" | "admin" | "talent" | "unknown";

export const DEFAULT_ROUTE_BY_TYPE: Record<AccountType, string> = {
  company: "/",           // v1.0.0: B2B deferred, redirect to home
  admin: "/dashboard",
  talent: "/app/learning", // v1.0.0: feed deferred, learning is home
  unknown: "/app/learning",
};

export function getDefaultRouteFor(type: AccountType): string {
  return DEFAULT_ROUTE_BY_TYPE[type] ?? "/app/learning";
}

/**
 * Pick the safest landing route. Honors `returnTo` when present and not an
 * auth page; otherwise falls back to the account-type default.
 */
export function resolvePostAuthRoute(
  type: AccountType,
  returnTo?: string | null,
): string | null {
  if (returnTo && !returnTo.includes("/auth")) return returnTo;
  // Don't guess while account type is still resolving — caller should wait.
  if (type === "unknown") return null;
  return getDefaultRouteFor(type);
}

