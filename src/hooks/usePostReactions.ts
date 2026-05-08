import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import {
  useFeedEngagement,
  patchEngagementCache,
  EMPTY_REACTIONS,
  type ReactionType,
} from "@/hooks/useFeedEngagement";

/**
 * Per-post reaction hook — fully optimistic with 200ms tap-lock.
 * Reads from the shared batched engagement cache (no N+1 fetches).
 */

export type { ReactionType };

interface UsePostReactionsResult {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  toggleReaction: (type: ReactionType) => Promise<void>;
  isLoading: boolean;
}

const TAP_LOCK_MS = 200;

export function usePostReactions(postId: string): UsePostReactionsResult {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastTap = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to shared cache (batched RPC fills it)
  const { data: engagementMap } = useFeedEngagement([postId]);
  const eng = engagementMap?.[postId];
  const reactions = eng?.reactionCounts || EMPTY_REACTIONS;
  const userReaction = eng?.userReaction || null;

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      const now = Date.now();
      if (now - lastTap.current < TAP_LOCK_MS) return;
      lastTap.current = now;

      if (!talent?.id) {
        toast({ title: "Sign in required", description: "Sign in to react.", variant: "destructive" });
        return;
      }

      const prevUserReaction = userReaction;
      const isToggleOff = prevUserReaction === type;

      // OPTIMISTIC: update cache immediately
      patchEngagementCache(queryClient, talent.id, postId, (curr) => {
        const next = { ...curr, reactionCounts: { ...curr.reactionCounts } };
        if (isToggleOff) {
          next.reactionCounts[type] = Math.max(0, next.reactionCounts[type] - 1);
          next.userReaction = null;
        } else {
          if (prevUserReaction) {
            next.reactionCounts[prevUserReaction] = Math.max(
              0,
              next.reactionCounts[prevUserReaction] - 1,
            );
          }
          next.reactionCounts[type] = (next.reactionCounts[type] || 0) + 1;
          next.userReaction = type;
        }
        return next;
      });

      setIsLoading(true);
      try {
        if (isToggleOff) {
          const { error } = await supabase
            .from("post_reactions")
            .delete()
            .eq("post_id", postId)
            .eq("talent_id", talent.id);
          if (error) throw error;
        } else {
          if (prevUserReaction) {
            await supabase.from("post_reactions").delete().eq("post_id", postId).eq("talent_id", talent.id);
          }
          const { error } = await supabase
            .from("post_reactions")
            .insert({ post_id: postId, talent_id: talent.id, reaction_type: type });
          if (error) throw error;
        }
      } catch (err: any) {
        // ROLLBACK
        patchEngagementCache(queryClient, talent.id, postId, (curr) => {
          const next = { ...curr, reactionCounts: { ...curr.reactionCounts } };
          if (isToggleOff) {
            next.reactionCounts[type] = (next.reactionCounts[type] || 0) + 1;
            next.userReaction = type;
          } else {
            next.reactionCounts[type] = Math.max(0, next.reactionCounts[type] - 1);
            if (prevUserReaction) {
              next.reactionCounts[prevUserReaction] =
                (next.reactionCounts[prevUserReaction] || 0) + 1;
            }
            next.userReaction = prevUserReaction;
          }
          return next;
        });
        console.error("Reaction error:", err);
        toast({ title: "Couldn't save reaction", description: "Please try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [postId, talent?.id, userReaction, queryClient, toast],
  );

  return { reactions, userReaction, toggleReaction, isLoading };
}
