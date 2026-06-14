import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  resetThreadUnread,
  markThreadNotificationsRead,
  ensureSystemThread,
  listMessageThreadsByTalent,
  listAiAgentsByKeys,
} from "@/domains/messaging/repo/messagingRepo";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Messaging & Agent Thread Sentinel (V5.6.0)
 * CTO Reference: Authoritative controller for real-time conversational sync.
 * Architecture: Digital Workforce enabled - logs communication drops to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export interface MessageThread {
  id: string;
  talent_id: string;
  thread_type: "agent" | "system" | "peer";
  agent_key: string | null;
  peer_talent_id?: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender: string | null;
  unread_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  agentName?: string;
  agentAvatarUrl?: string | null;
  agentColor?: string | null;
}

export function useMessageThreads() {
  const { talent } = useTalent();
  const talentId = talent?.id;
  const qc = useQueryClient();
  const queryKey = ["message-threads", talentId];

  // --- SENSOR: THREAD_AGGREGATION_QUERY ---
  const {
    data: threads = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!talentId,
    staleTime: 30000, // 30s consistency boundary
    queryFn: async (): Promise<MessageThread[]> => {
      // HUD: INITIALIZING_SYSTEM_THREAD_HANDSHAKE
      await ensureSystemThread(talentId);

      let rows: any[];
      try {
        rows = await listMessageThreadsByTalent(talentId);
      } catch (error) {
        console.error("[Digital Workforce] ANOMALY: message_threads lookup failed.", error);
        throw error;
      }

      // HUD: AGENT_METADATA_ENRICHMENT
      const agentKeys = Array.from(
        new Set((rows || []).filter((r) => r.thread_type === "agent" && r.agent_key).map((r) => r.agent_key as string)),
      );

      let agentMeta: Record<string, { name: string; avatar_url: string | null; color: string | null }> = {};

      if (agentKeys.length) {
        const agents = await listAiAgentsByKeys(agentKeys);
        (agents || []).forEach((a: any) => {
          agentMeta[a.agent_key] = { name: a.name, avatar_url: a.avatar_url, color: a.color };
        });
      }

      // HUD: PEER_METADATA_ENRICHMENT
      const peerTalentIds = Array.from(
        new Set((rows || []).filter((r) => r.thread_type === "peer" && r.peer_talent_id).map((r) => r.peer_talent_id as string)),
      );

      let peerMeta: Record<string, { name: string; avatar_url: string | null }> = {};

      if (peerTalentIds.length) {
        const { data: peers, error: peerError } = await supabase
          .from("talents")
          .select("id, full_name, profile_photo_url")
          .in("id", peerTalentIds);

        if (!peerError && peers) {
          peers.forEach((p) => {
            peerMeta[p.id] = { name: p.full_name, avatar_url: p.profile_photo_url };
          });
        }
      }

      return (rows || []).map((r: any) => {
        let agentName = "System Notification";
        let agentAvatarUrl: string | null = null;
        let agentColor: string | null = null;

        if (r.thread_type === "system") {
          agentName = "AI General";
          agentColor = "#2A7DDE";
        } else if (r.thread_type === "agent" && r.agent_key) {
          agentName = agentMeta[r.agent_key]?.name || r.agent_key || "Agent";
          agentAvatarUrl = agentMeta[r.agent_key]?.avatar_url ?? null;
          agentColor = agentMeta[r.agent_key]?.color ?? null;
        } else if (r.thread_type === "peer" && r.peer_talent_id) {
          agentName = peerMeta[r.peer_talent_id]?.name || "Connection";
          agentAvatarUrl = peerMeta[r.peer_talent_id]?.avatar_url ?? null;
          agentColor = "#10B981"; // Emerald green for peer DMs
        }

        return {
          ...r,
          agentName,
          agentAvatarUrl,
          agentColor,
        };
      });
    },
  });

  // --- HUD: REALTIME_CDC_SYNCHRONIZER ---
  useEffect(() => {
    if (!talentId) return;

    const channel = supabase
      .channel(`public:threads:${talentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_threads", filter: `talent_id=eq.${talentId}` },
        () => {
          void qc.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [talentId, qc, queryKey]);

  // --- ACTION: THREAD_RESOLUTION_MUTATION ---
  const markThreadRead = useCallback(
    async (threadId: string) => {
      // HUD: ATOMIC_UNREAD_COUNT_RESET
      const { error } = await resetThreadUnread(threadId);

      if (error) {
        console.error("[Digital Workforce] ANOMALY: markThreadRead database write rejected.", error);
        return;
      }

      // HUD: OPTIMISTIC_CACHE_PATCHING
      qc.setQueryData(queryKey, (old: MessageThread[] | undefined) =>
        old?.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t)),
      );

      // Relational cleanup for notification ledger
      await markThreadNotificationsRead(threadId);
    },
    [qc, queryKey],
  );

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);

  return {
    threads,
    isLoading,
    refresh: refetch,
    markThreadRead,
    totalUnread,
  };
}
