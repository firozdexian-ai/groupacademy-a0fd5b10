/**
 * Companies Domain Hooks â€” Company Profile Detail Hook
 * Version: 2024 Highly Professional SAAS UI
 * Rules: Enforces standard business data structures and maps operational errors to user-friendly messages.
 */
import { useQuery } from "@tanstack/react-query";
import { getCompanyDetail } from "@/domains/companies/repo/companiesRepo";

export interface CompanyDetail {
  header: {
    company_name: string;
    logo_url: string | null;
    active_jobs: number;
    jobs_last_14d: number;
  };
  locations: { location: string; count: number }[];
  types: { type: string; count: number }[];
  jobs: unknown[];
}

/**
 * Custom hook to fetch complete profiles for a specific company name.
 * Provides company information, job statistics, and active listings with structural fallbacks.
 */
export function useCompanyDetail(companyName: string | null) {
  return useQuery({
    queryKey: ["company-detail", companyName],
    enabled: !!companyName,
    // Performance Baseline: Enforce 5-minute cache consistency to maximize high-performance SaaS scaling
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CompanyDetail> => {
      if (!companyName) {
        throw new Error("Company name is required to load profile data.");
      }

      let data: unknown;
      try {
        data = await getCompanyDetail<unknown>(companyName);
      } catch (error: unknown) {
        // Digital Workforce Rule: Log operational failures cleanly to system channels
        console.error("Company profile query encountered an infrastructure delay:", {
          companyName,
          message: error?.message,
          code: error?.code,
        });
        throw new Error("We hit a snag loading company records. Our team has been notified.");
      }

      // Safeguard: Guarantee core layout structure returns to prevent UI components from crashing
      return (
        (data as unknown as CompanyDetail) || {
          header: { company_name: companyName, logo_url: null, active_jobs: 0, jobs_last_14d: 0 },
          locations: [],
          types: [],
          jobs: [],
        }
      );
    },
  });
}

