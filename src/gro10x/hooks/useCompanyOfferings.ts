/**
 * Reads/writes a company's services & products catalog.
 * Used by the public company page and the Activities â†’ Offerings editor.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  listCompanyOfferings,
  upsertCompanyOffering,
  deleteCompanyOffering,
} from "@/domains/companies/repo/companiesRepo";

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
      const data = await listCompanyOfferings(companyId!, !!opts?.activeOnly);
      return data as CompanyOffering[];
    },
  });
}

export function useUpsertOffering(companyId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CompanyOffering> & { name: string; kind: "service" | "product" }) => {
      if (!companyId || !user) throw new Error("Missing company or user");
      await upsertCompanyOffering({
        ...input,
        company_id: companyId,
        created_by: user.id,
      });
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
      await deleteCompanyOffering(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gro10x-offerings", companyId] });
    },
  });
}

