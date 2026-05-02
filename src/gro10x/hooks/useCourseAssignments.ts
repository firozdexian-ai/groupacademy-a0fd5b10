/**
 * Loads B2B-tagged courses + the current user's company assignments.
 * Single source of truth for the Gro10x Learn tab.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "./useActiveCompany";

export interface B2BCourse {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  duration_hours: number | null;
  credit_cost: number | null;
  b2b_audience: string[] | null;
}

export interface CourseAssignment {
  id: string;
  company_id: string;
  content_id: string;
  assigned_to: string | null;
  due_at: string | null;
  sponsorship_mode: "free" | "company_credits" | "employee_credits";
  credit_cost: number;
  note: string | null;
  created_at: string;
  content?: B2BCourse | null;
  company_name?: string | null;
}

export function useB2BCatalog() {
  return useQuery({
    queryKey: ["gro10x-b2b-catalog"],
    staleTime: 60_000,
    queryFn: async (): Promise<B2BCourse[]> => {
      const { data, error } = await supabase
        .from("content")
        .select("id,title,slug,description,thumbnail_url,cover_image_url,duration_hours,credit_cost,b2b_audience")
        .eq("is_b2b", true)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as B2BCourse[];
    },
  });
}

export function useMyAssignments() {
  const { user } = useAuth();
  const { companyId } = useActiveCompany();
  return useQuery({
    queryKey: ["gro10x-my-assignments", user?.id, companyId],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<CourseAssignment[]> => {
      // Either explicitly assigned to me, or company-wide (assigned_to IS NULL) for my company
      const orFilter = companyId
        ? `assigned_to.eq.${user!.id},and(assigned_to.is.null,company_id.eq.${companyId})`
        : `assigned_to.eq.${user!.id}`;

      const { data, error } = await supabase
        .from("company_course_assignments")
        .select(
          `id, company_id, content_id, assigned_to, due_at, sponsorship_mode, credit_cost, note, created_at,
           content:content_id ( id, title, slug, description, thumbnail_url, cover_image_url, duration_hours, credit_cost, b2b_audience ),
           company:company_id ( name )`
        )
        .or(orFilter)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        company_name: r.company?.name ?? null,
      })) as CourseAssignment[];
    },
  });
}

export function useCompanyAssignments(companyId: string | null) {
  return useQuery({
    queryKey: ["gro10x-company-assignments", companyId],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_course_assignments")
        .select(
          `id, content_id, assigned_to, sponsorship_mode, credit_cost, due_at, created_at,
           content:content_id ( id, title, thumbnail_url )`
        )
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
