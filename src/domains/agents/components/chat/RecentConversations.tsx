import { useMemo } from "react";
import { MessageCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, isValid } from "date-fns";
import { AgentSession } from "@/domains/agents/hooks/useAgentChat";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/domains/agents/components/chat/AgentAvatar";
import { trackError } from "@/lib/errorTracking";

/**
 * Group Academy â€” Career Guidance System: Recent Conversations Ledger Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/chat?tab=history (User Conversation Ledger viewport)
 * Operations Mode: High-performance session tracker aggregating historical chat sequences.
 */

interface RecentConversationsProps {
  sessions: AgentSession[];
  onSelectSession: (sessionId: string) => void;
  getAgentName: (agentKey: string) => string;
  getAgentIcon?: (agentKey: string) => React.ReactNode;
  getAgentAvatar?: (agentKey: string) => string | null;
  isCompanyAgent?: (agentKey: string) => boolean;
  isCreatorAgent?: (agentKey: string) => boolean;
}

export function RecentConversations({
  sessions = [],
  onSelectSession,
  getAgentName,
  getAgentAvatar,
  isCompanyAgent,
  isCreatorAgent,
}: RecentConversationsProps) {
  // --- PHASE: SESSION_ARRAY_NORMALIZATION_MATRIX ---
  const normalizedSessions = useMemo(() => {
    const currentUnixTimestamp = Date.now();

    return sessions.slice(0, 5).map((session) => {
      const messagesArray = session.messages || [];
      const lastMessage = messagesArray[messagesArray.length - 1] || null;
      const rawAgentName = String(getAgentName(session.agent_key) || "Guidance Assistant");

      // Compute precise validation flags safely without runtime allocations inside loops
      const expirationTimestamp = session.session_expires_at ? new Date(session.session_expires_at).getTime() : 0;
      const isActive = Boolean(session.is_active && expirationTimestamp > currentUnixTimestamp);

      // Defensively parse historical timestamps to verify formatting consistency
      const timeAgoLabel = (() => {
        const creationDate = new Date(session.created_at);
        if (!isValid(creationDate)) return "Recent";
        try {
          return formatDistanceToNow(creationDate, { addSuffix: true });
        } catch (err: unknown) {
          trackError("recent-conversations-temporal-sync-failure", { error: err.message, id: session.id });
          return "Active";
        }
      })();

      return {
        ...session,
        lastMessage,
        isActive,
        timeAgoLabel,
        agentName: rawAgentName,
      };
    });
  }, [sessions, getAgentName]);

  // Guard the component viewport completely against empty session logs arrays
  if (sessions.length === 0) {
    return (
      <Card className="border border-dashed border-border bg-muted/5 rounded-2xl overflow-hidden select-none animate-in fade-in duration-300">
        <CardContent className="p-10 text-center flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted border border-border/40 flex items-center justify-center text-muted-foreground/40">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">No Active Logs Found</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
              Start a conversation with an advisory assistant to see it listed here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 select-none text-left">
      {normalizedSessions.map((session) => {
        return (
          <Card
            key={session.id}
            className={cn(
              "group cursor-pointer transition-all duration-200 rounded-2xl border overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
              "bg-card border-border hover:border-primary/40 hover:shadow-sm",
              session.isActive && "border-emerald-500/20 bg-emerald-500/[0.01]",
            )}
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Component Avatar Node Wrapper */}
                <div className="relative shrink-0">
                  <AgentAvatar
                    name={session.agentName}
                    avatarUrl={getAgentAvatar?.(session.agent_key)}
                    isOnline={session.isActive}
                    isCompanyAgent={isCompanyAgent?.(session.agent_key)}
                    isCreatorAgent={isCreatorAgent?.(session.agent_key)}
                    size="md"
                    className="transition-transform duration-200 group-hover:scale-102"
                  />
                </div>

                {/* Profile Meta Frame Column Grid */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {session.agentName}
                      </span>
                      {session.isActive && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none text-[9px] font-bold px-1.5 py-0 rounded-full shrink-0 animate-pulse"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60 shrink-0 font-medium tracking-tight">
                      {session.timeAgoLabel}
                    </span>
                  </div>

                  {/* Chat Preview Transcript Sub-Block */}
                  <div className="flex items-center gap-1 min-h-[16px]">
                    {session.lastMessage ? (
                      <p className="text-xs text-muted-foreground/80 truncate leading-normal flex-1 pr-1">
                        {session.lastMessage.role === "user" ? (
                          <span className="text-primary font-bold mr-1 text-[10px] uppercase tracking-wide">You:</span>
                        ) : null}
                        {session.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 italic leading-normal">
                        Conversation channel established.
                      </p>
                    )}
                  </div>

                  {/* Operational Telemetry Metrics Footprint */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50 tracking-tight">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span>{session.messages?.length || 0} interactions</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Chevron Affordance */}
                <div className="flex items-center h-full pl-1 shrink-0">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300 ease-out" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default RecentConversations;


