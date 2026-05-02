/**
 * Resolves the **admin scope** for the current user — used by `/admin` to
 * decide which sidebar groups to render and whether the impersonation banner
 * is available.
 *
 *   super         → super_admin role; sees all groups
 *   internal      → admin / staff / talent_exec / content_lead; ops groups + impersonation
 *   company       → owner/admin of a company (and not internal staff); company-scoped groups only
 *   none          → no admin access
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AdminScope = "super" | "internal" | "company" | "none";

const SUPER_ROLES = new Set(["super_admin"]);
const INTERNAL_ROLES = new Set(["admin", "staff", "talent_exec", "content_lead"]);

export function useAdminScope() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["admin-scope", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<{ scope: AdminScope; companyId: string | null }> => {
      if (!user?.id) return { scope: "none", companyId: null };

      const [{ data: roles }, { data: company }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("company_members")
          .select("company_id, role")
          .eq("user_id", user.id)
          .eq("status", "active")
          .in("role", ["owner", "admin"])
          .limit(1)
          .maybeSingle(),
      ]);

      const roleSet = new Set((roles ?? []).map((r) => r.role as string));
      if ([...roleSet].some((r) => SUPER_ROLES.has(r))) {
        return { scope: "super", companyId: company?.company_id ?? null };
      }
      if ([...roleSet].some((r) => INTERNAL_ROLES.has(r))) {
        return { scope: "internal", companyId: company?.company_id ?? null };
      }
      if (company?.company_id) {
        return { scope: "company", companyId: company.company_id };
      }
      return { scope: "none", companyId: null };
    },
  });

  return {
    scope: (query.data?.scope ?? "none") as AdminScope,
    companyId: query.data?.companyId ?? null,
    isLoading: authLoading || (!!user?.id && query.isLoading),
  };
}
