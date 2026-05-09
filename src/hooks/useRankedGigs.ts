import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankedGig {
  gig_id: string;
  kind: string;
  title: string;
  description: string | null;
  skill_category: string | null;
  credits: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  rank_score: number;
  match_score: number;
}

const PAGE_SIZE = 12;

/**
 * Infinite, keyset-paginated unified gig feed.
 * Mirrors useRankedJobs — cursor = previous page's lowest rank_score.
 */
export function useRankedGigs(talentId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: ["ranked-gigs", talentId ?? null],
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_ranked_gigs_for_talent", {
        _talent_id: talentId ?? null,
        _cursor: pageParam,
        _limit: PAGE_SIZE,
      });
      if (error) throw error;
      return (data ?? []) as RankedGig[];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return Number(lastPage[lastPage.length - 1].rank_score);
    },
    staleTime: 3 * 60 * 1000,
  });
}
