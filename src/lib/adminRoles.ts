/**
 * Single source of truth for admin-style roles.
 * Keep this list in sync everywhere — useAccountType, ProtectedRoute, edge functions.
 */
export const ADMIN_ROLES = [
  "admin",
  "super_admin",
  "staff",
  "talent_exec",
  "content_lead",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}
