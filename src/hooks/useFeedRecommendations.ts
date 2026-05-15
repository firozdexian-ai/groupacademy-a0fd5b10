import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useMemo } from "react";
import { toast } from "sonner";

/**
 * GroUp Academy: Social Feed Batch Engagement & Action Engine (V5.6.0)
 * CTO Reference: Unified controller for engagement sensors and interaction mutations.
 * Architecture: Digital Workforce enabled - streams lookup and cache exceptions directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened.
 */

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

export interface PostEngagement {
  reactionCounts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  pollCounts: Record<string, number>;
  userVote: string | null;
}

export const EMPTY_REACTIONS: Record<ReactionType, number> = {
  like: 0,
  insightful: 0,
  celebrate: 0,
  support: 0,
};

// --- HUD: REGISTRY_KEYS ---
export function feedEngagementKey(talentId: string | undefined) {
  return ["feed-engagement", talentId || "anon"];
}

// --- SENSOR: BATCH_ENGAGEMENT_QUERY ---
export function useFeedEngagement(postIds: string[]) {
  const { talent } = useTalent();

  const sortedKey = useMemo(() => [...postIds].sort().join(","), [postIds]);

  return useQuery({
    queryKey: [...feedEngagementKey(talent?.id), sortedKey],
    enabled: postIds.length > 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Record<string, PostEngagement>> => {
      if (postIds.length === 0) return {};

      const { data, error } = await supabase.rpc("get_feed_engagement", {
        _post_ids: postIds,
        _talent_id: talent?.id || null,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: get_feed_engagement failed.", error);
        throw error;
      }

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
  });
}

// --- CACHE_ORCHESTRATOR: OPTIMISTIC_UPDATES ---
export function patchEngagementCache(
  queryClient: any,
  talentId: string | undefined,
  postId: string,
  patch: (curr: PostEngagement) => PostEngagement,
) {
  const prefix = feedEngagementKey(talentId);
  const queries = queryClient.getQueriesData({ queryKey: prefix });

  queries.forEach(([key, data]: [any, any]) => {
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

// --- ACTIONS: FEED_MUTATIONS ---
export function useFeedActions() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  const toggleReaction = useMutation({
    mutationFn: async ({ postId, reaction }: { postId: string; reaction: ReactionType }) => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED");
      const { data, error } = await supabase.rpc("toggle_post_reaction", {
        p_post_id: postId,
        p_talent_id: talent.id,
        p_reaction: reaction,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ postId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: feedEngagementKey(talent?.id) });
      patchEngagementCache(queryClient, talent?.id, postId, (curr) => {
        const isSame = curr.userReaction === reaction;
        const nextReaction = isSame ? null : reaction;
        const updatedCounts = { ...curr.reactionCounts };
        if (curr.userReaction)
          updatedCounts[curr.userReaction] = Math.max(0, (updatedCounts[curr.userReaction] || 0) - 1);
        if (!isSame) updatedCounts[reaction] = (updatedCounts[reaction] || 0) + 1;
        return { ...curr, reactionCounts: updatedCounts, userReaction: nextReaction };
      });
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: Reaction failed.", err);
      toast.error("Handshake failed. Reverting.");
      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
    },
  });

  const castPollVote = useMutation({
    mutationFn: async ({ postId, optionKey }: { postId: string; optionKey: string }) => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED");
      const { error } = await supabase.rpc("cast_poll_vote", {
        p_post_id: postId,
        p_talent_id: talent.id,
        p_option_key: optionKey,
      });
      if (error) throw error;
    },
    onMutate: async ({ postId, optionKey }) => {
      await queryClient.cancelQueries({ queryKey: feedEngagementKey(talent?.id) });
      patchEngagementCache(queryClient, talent?.id, postId, (curr) => {
        const updatedPoll = { ...curr.pollCounts };
        if (curr.userVote && updatedPoll[curr.userVote])
          updatedPoll[curr.userVote] = Math.max(0, updatedPoll[curr.userVote] - 1);
        updatedPoll[optionKey] = (updatedPoll[optionKey] || 0) + 1;
        return { ...curr, pollCounts: updatedPoll, userVote: optionKey };
      });
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: Poll failed.", err);
      toast.error("Vote failed. Syncing...");
      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
    },
  });

  return { toggleReaction, castPollVote };
}
