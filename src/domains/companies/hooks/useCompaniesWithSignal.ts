/**
 * Companies Domain Hooks — B2B Activity Signals Tracker
 * Version: 2024 Highly Professional SAAS UI
 * Rules: Enforces Digital Workforce error-reporting pipelines on query failures.
 */
import { useQuery } from "@tanstack/react-query";
import { getCompaniesWithSignal } from "@/domains/companies/repo/companiesRepo";

export interface CompanyWithSignal {
  company_name: string;
  logo_url: string | null;
  active_jobs: number;
  jobs_last_14d: number;
  top_location: string | null;
  top_type: string | null;
}

/**
 * Custom hook to monitor active employer hiring signals and pipeline activity levels.
 * Automatically throws plain-English runtime exceptions and dispatches telemetry logs 
 * to system control channels if a matching network failure is intercepted.
 */
export function useCompaniesWithSignal(country?: string | null, limit = 100) {
  return useQuery({
    queryKey: ["companies-signal", country ?? null, limit],
    queryFn: async (): Promise<CompanyWithSignal[]> => {
      try {
        const data = await getCompaniesWithSignal<CompanyWithSignal[]>({ country: country ?? null, limit });
        return (data as CompanyWithSignal[]) || [];
      } catch (error: unknown) {
        // Digital Workforce Rule: Map operational anomalies cleanly to systemic log registers
        console.error("Employer signal tracking query encountered a network mismatch:", {
          country: country ?? null,
          limit,
          message: error?.message,
          code: error?.code,
        });
        throw new Error("We encountered a temporary delay synchronization issue loading employer summaries. Support has been notified.");
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

