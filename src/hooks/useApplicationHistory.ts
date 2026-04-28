import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Institutional Application Ledger
 * CTO Reference: Authoritative hook for market engagement tracking and history.
 */

export interface ApplicationHistoryItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  deliveryStatus: string;
  appliedAt: string;
  isPaid: boolean;
}

export function useApplicationHistory() {
  const { talent } = useTalent();
  const [applications, setApplications] = useState<ApplicationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function executeLedgerSync() {
      // Identity Verify: Ensure talent node is hydrated
      if (!talent?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // HUD: NEURAL_RELATIONAL_SYNC
        const { data, error: fetchError } = await supabase
          .from("job_applications")
          .select(
            `
            id,
            job_id,
            application_status,
            delivery_status,
            created_at,
            is_paid,
            jobs:job_id (
              title,
              company_name
            )
          `,
          )
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        // HUD: REGISTRY_MAPPING_PROTOCOL
        const formattedApplications: ApplicationHistoryItem[] = (data || []).map((app: any) => ({
          id: app.id,
          jobId: app.job_id,
          jobTitle: app.jobs?.title || "Unknown_Node",
          companyName: app.jobs?.company_name || "Unknown_Institution",
          applicationStatus: app.application_status || "submitted",
          deliveryStatus: app.delivery_status || "pending",
          appliedAt: app.created_at,
          isPaid: app.is_paid || false,
        }));

        setApplications(formattedApplications);
        setError(null);
      } catch (err) {
        console.error("LEDGER_SYNC_FAULT:", err);
        setError("REGISTRY_FAULT: Failed to load application history.");
      } finally {
        setIsLoading(false);
      }
    }

    executeLedgerSync();
  }, [talent?.id]);

  return { applications, isLoading, error };
}
