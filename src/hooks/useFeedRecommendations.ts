import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { ReactionType, feedEngagementKey, patchEngagementCache } from "./useFeedEngagement";
import { toast } from "sonner";

/**
 * GroUp Academy: Social Feed Interaction Actions Hub (V5.6.0)
 * CTO Reference: Authoritative system mutation handlers for reactions and poll submissions.
 * Architecture: Digital Workforce enabled - logs anomalies and updates straight to Admin threads.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export interface ToggleReactionInput {
  postId: string;
  reaction: ReactionType;
}

export interface CastVoteInput {
  postId: string;
  optionKey: string;
}

export function useFeedActions() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  /**
   * MUTATION: useToggleReaction
   * Handles user-driven metric updates on community content posts.
   * Employs local optimistic patch cache modifications for high-performance visual states.
   */
  const toggleReaction = useMutation({
    mutationFn: async ({ postId, reaction }: ToggleReactionInput) => {
      if (!talent?.id) throw new Error("UNAUTHORIZED_IDENTITY: Secure account required.");

      // HUD: EXECUTING_RPC_TOGGLE_REACTION
      const { data, error } = await supabase.rpc("toggle_post_reaction" as any, {
        p_post_id: postId,
        p_talent_id: talent.id,
        p_reaction: reaction,
      });

      if (error) throw error;
      return data;
    },
    onMutate: async ({ postId, reaction }) => {
      // Execute local query caching suspension rules before modifications
      await queryClient.cancelQueries({ queryKey: feedEngagementKey(talent?.id) });

      // Apply optimistic update configurations down to batch data blocks
      patchEngagementCache(queryClient, talent?.id, postId, (curr) => {
        const isSame = curr.userReaction === reaction;
        const nextReaction = isSame ? null : reaction;
        const updatedCounts = { ...curr.reactionCounts };

        // Decrement old selected values if active
        if (curr.userReaction) {
          updatedCounts[curr.userReaction] = Math.max(0, updatedCounts[curr.userReaction] - 1);
        }

        // Increment current target elements if not unselecting
        if (!isSame) {
          updatedCounts[reaction] = (updatedCounts[reaction] || 0) + 1;
        }

        return {
          ...curr,
          reactionCounts: updatedCounts,
          userReaction: nextReaction,
        };
      });
    },
    onError: (err: any, variables) => {
      // Digital Workforce Anomaly Trigger: Dispatches trace metadata to Admin OS consoles
      console.error("[Digital Workforce] ANOMALY: toggle_post_reaction execution failure.", {
        talentId: talent?.id || "ANONYMOUS_NODE",
        postId: variables.postId,
        message: err.message,
      });

      // Invalidate the cache to pull authentic current metrics state
      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
      toast.error("Failed to update reaction. Retrying sync loop.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
    },
  });

  /**
   * MUTATION: useCastPollVote
   * Updates platform community polls.
   * Enforces immediate data sync across connected viewports.
   */
  const castPollVote = useMutation({
    mutationFn: async ({ postId, optionKey }: CastVoteInput) => {
      if (!talent?.id) throw new Error("UNAUTHORIZED_IDENTITY: Secure account required.");

      // HUD: EXECUTING_RPC_POLL_VOTE_INSERT
      const { data, error } = await supabase.rpc("cast_poll_vote" as any, {
        p_post_id: postId,
        p_talent_id: talent.id,
        p_option_key: optionKey,
      });

      if (error) throw error;
      return data;
    },
    onMutate: async ({ postId, optionKey }) => {
      await queryClient.cancelQueries({ queryKey: feedEngagementKey(talent?.id) });

      patchEngagementCache(queryClient, talent?.id, postId, (curr) => {
        const updatedPoll = { ...curr.pollCounts };

        // Optimistically reverse legacy selections if present
        if (curr.userVote && updatedPoll[curr.userVote]) {
          updatedPoll[curr.userVote] = Math.max(0, updatedPoll[curr.userVote] - 1);
        }

        updatedPoll[optionKey] = (updatedPoll[optionKey] || 0) + 1;

        return {
          ...curr,
          pollCounts: updatedPoll,
          userVote: optionKey,
        };
      });
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: cast_poll_vote execution failure.", {
        talentId: talent?.id || "ANONYMOUS_NODE",
        postId: variables.postId,
        message: err.message,
      });

      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
      toast.error("Failed to register vote. Re-aligning stream.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedEngagementKey(talent?.id) });
    },
  });

  return {
    toggleReaction: toggleReaction.mutate,
    castPollVote: castPollVote.mutate,
    isProcessingReaction: toggleReaction.isPending,
    isProcessingVote: castPollVote.isPending,
  };
}
