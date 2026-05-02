/**
 * Reads/writes a company's services & products catalog.
 * Used by the public company page and the Activities → Offerings editor.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CompanyOffering {
  id: string;
  company_id: string;
  kind: "service" | "product";
  name: string;
  tagline: string | null;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  unit: string | null;
  tags: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export function useCompanyOfferings(companyId: string | null, opts?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ["gro10x-offerings", companyId, opts?.activeOnly ?? false],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async (): Promise<CompanyOffering[]> => {
      let q = supabase
        .from("company_offerings")
        .select("*")
        .eq("company_id", companyId!)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (opts?.activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CompanyOffering[];
    },
  });
}

export function useUpsertOffering(companyId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CompanyOffering> & { name: string; kind: "service" | "product" }) => {
      if (!companyId || !user) throw new Error("Missing company or user");
      const payload = {
        ...input,
        company_id: companyId,
        created_by: user.id,
      };
      if (input.id) {
        const { error } = await supabase
          .from("company_offerings")
          .update(payload)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_offerings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gro10x-offerings", companyId] });
    },
  });
}

export function useDeleteOffering(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_offerings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gro10x-offerings", companyId] });
    },
  });
}
