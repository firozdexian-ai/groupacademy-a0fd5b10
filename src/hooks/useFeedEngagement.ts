import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useMemo } from "react";

/**
 * Batched engagement fetcher — single RPC call replaces N+1 per-post queries.
 * Returns reaction counts, user reaction, poll counts, and user vote for a list of post IDs.
 */

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

export interface PostEngagement {
  reactionCounts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  pollCounts: Record<string, number>;
  userVote: string | null;
}

const EMPTY_REACTIONS: Record<ReactionType, number> = {
  like: 0,
  insightful: 0,
  celebrate: 0,
  support: 0,
};

export function feedEngagementKey(talentId: string | undefined) {
  return ["feed-engagement", talentId || "anon"];
}

export function useFeedEngagement(postIds: string[]) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // Stable comma-key so order changes don't refetch
  const sortedKey = useMemo(() => [...postIds].sort().join(","), [postIds]);

  const query = useQuery({
    queryKey: [...feedEngagementKey(talent?.id), sortedKey],
    queryFn: async (): Promise<Record<string, PostEngagement>> => {
      if (postIds.length === 0) return {};
      const { data, error } = await (supabase as any).rpc("get_feed_engagement", {
        _post_ids: postIds,
        _talent_id: talent?.id || null,
      });
      if (error) throw error;
      const map: Record<string, PostEngagement> = {};
      (data || []).forEach((row: any) => {
        const rc = row.reaction_counts || {};
        map[row.post_id] = {
          reactionCounts: {
            like: Number(rc.like || 0),
            insightful: Number(rc.insightful || 0),
            celebrate: Number(rc.celebrate || 0),
            support: Number(rc.support || 0),
          },
          userReaction: (row.user_reaction as ReactionType) || null,
          pollCounts: row.poll_counts || {},
          userVote: row.user_vote || null,
        };
      });
      return map;
    },
    enabled: postIds.length > 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return query;
}

/** Helpers for optimistic mutations on cached engagement */
export function patchEngagementCache(
  queryClient: ReturnType<typeof useQueryClient>,
  talentId: string | undefined,
  postId: string,
  patch: (curr: PostEngagement) => PostEngagement,
) {
  const prefix = feedEngagementKey(talentId);
  const queries = queryClient.getQueriesData<Record<string, PostEngagement>>({ queryKey: prefix });
  queries.forEach(([key, data]) => {
    if (!data) return;
    const curr = data[postId] || {
      reactionCounts: { ...EMPTY_REACTIONS },
      userReaction: null,
      pollCounts: {},
      userVote: null,
    };
    queryClient.setQueryData(key, { ...data, [postId]: patch(curr) });
  });
}

export { EMPTY_REACTIONS };
