import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useFeedEngagement, patchEngagementCache } from "@/hooks/useFeedEngagement";

/**
 * Poll voting hook — optimistic with 200ms tap-lock.
 * Reads from shared batched engagement cache.
 */

interface PollResult {
  optionId: string;
  votes: number;
  percentage: number;
}

interface UsePollVotingResult {
  hasVoted: boolean;
  userVote: string | null;
  results: PollResult[];
  totalVotes: number;
  castVote: (optionId: string) => Promise<void>;
  isLoading: boolean;
}

const TAP_LOCK_MS = 200;

export function usePollVoting(
  postId: string,
  options: { id: string; text: string }[],
): UsePollVotingResult {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastTap = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  const { data: engagementMap } = useFeedEngagement([postId]);
  const eng = engagementMap?.[postId];
  const voteCounts = eng?.pollCounts || {};
  const userVote = eng?.userVote || null;
  const hasVoted = !!userVote;

  const totalVotes = useMemo(
    () => Object.values(voteCounts).reduce((s: number, n: any) => s + Number(n || 0), 0),
    [voteCounts],
  );

  const results: PollResult[] = useMemo(
    () =>
      options.map((opt) => {
        const votes = Number(voteCounts[opt.id] || 0);
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return { optionId: opt.id, votes, percentage };
      }),
    [options, voteCounts, totalVotes],
  );

  const castVote = useCallback(
    async (optionId: string) => {
      const now = Date.now();
      if (now - lastTap.current < TAP_LOCK_MS) return;
      lastTap.current = now;

      if (!talent?.id) {
        toast({ title: "Sign in required", description: "Sign in to vote.", variant: "destructive" });
        return;
      }
      if (hasVoted) {
        toast({ title: "Already voted", description: "Your vote is already recorded." });
        return;
      }

      // OPTIMISTIC
      patchEngagementCache(queryClient, talent.id, postId, (curr) => ({
        ...curr,
        pollCounts: { ...curr.pollCounts, [optionId]: Number(curr.pollCounts[optionId] || 0) + 1 },
        userVote: optionId,
      }));

      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("poll_votes")
          .insert({ post_id: postId, talent_id: talent.id, option_id: optionId });
        if (error) throw error;
        toast({ title: "Vote recorded" });
      } catch (err: any) {
        // ROLLBACK
        patchEngagementCache(queryClient, talent.id, postId, (curr) => ({
          ...curr,
          pollCounts: {
            ...curr.pollCounts,
            [optionId]: Math.max(0, Number(curr.pollCounts[optionId] || 0) - 1),
          },
          userVote: null,
        }));
        console.error("Poll vote error:", err);
        toast({ title: "Couldn't save your vote", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [postId, talent?.id, hasVoted, queryClient, toast],
  );

  return { hasVoted, userVote, results, totalVotes, castVote, isLoading };
}
