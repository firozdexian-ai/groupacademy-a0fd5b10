import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GigsHubDashboard {
  talent_id: string | null;
  featured: any[];
  submission_counts: Record<string, { total: number; pending: number }>;
  my_bids: any[];
  my_contracts: any[];
  top_matches: any[];
  course_projects: any[];
  marketplace_projects: any[];
  generated_at: string;
}

const EMPTY: GigsHubDashboard = {
  talent_id: null,
  featured: [],
  submission_counts: {},
  my_bids: [],
  my_contracts: [],
  top_matches: [],
  course_projects: [],
  marketplace_projects: [],
  generated_at: new Date().toISOString(),
};

/**
 * Single-RPC zero-latency dashboard for /app/gigs.
 * Replaces the 8 legacy useQuery waterfalls (gigs, submissionCounts,
 * courseProjects, marketProjects, myBids, myContracts, matches).
 */
export function useGigsHubDashboard(enabled = true) {
  return useQuery({
    queryKey: ["gigs-hub-dashboard"],
    enabled,
    queryFn: async (): Promise<GigsHubDashboard> => {
      const { data, error } = await supabase.rpc("get_gigs_hub_dashboard");
      if (error) throw error;
      const d = (data as any) ?? {};
      return {
        talent_id: d.talent_id ?? null,
        featured: d.featured ?? [],
        submission_counts: d.submission_counts ?? {},
        my_bids: d.my_bids ?? [],
        my_contracts: d.my_contracts ?? [],
        top_matches: d.top_matches ?? [],
        course_projects: d.course_projects ?? [],
        marketplace_projects: d.marketplace_projects ?? [],
        generated_at: d.generated_at ?? EMPTY.generated_at,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
