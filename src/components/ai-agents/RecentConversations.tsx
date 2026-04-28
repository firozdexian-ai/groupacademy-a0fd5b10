import { MessageCircle, Clock, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { AgentSession } from "@/hooks/useAgentChat";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Session Ledger
 * CTO Reference: Authoritative list for active and historic agent interactions.
 */

interface RecentConversationsProps {
  sessions: AgentSession[];
  onSelectSession: (sessionId: string) => void;
  getAgentName: (agentKey: string) => string;
  getAgentIcon: (agentKey: string) => React.ReactNode;
}

export function RecentConversations({
  sessions,
  onSelectSession,
  getAgentName,
  getAgentIcon,
}: RecentConversationsProps) {
  if (sessions.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[32px] overflow-hidden">
        <CardContent className="p-12 text-center flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-2">
            <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              Registry_Empty
            </p>
            <p className="text-xs font-medium text-muted-foreground/40 italic">
              Initialize a neural dialogue to commence sync
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {sessions.slice(0, 5).map((session) => {
        const lastMessage = session.messages[session.messages.length - 1];
        const isActive = session.is_active && new Date(session.session_expires_at) > new Date();

        return (
          <Card
            key={session.id}
            className={cn(
              "group cursor-pointer transition-all duration-500 rounded-[24px] border-2 overflow-hidden",
              "bg-card/30 backdrop-blur-xl border-border/40 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-0.5",
              isActive && "border-emerald-500/20 bg-emerald-500/[0.02]",
            )}
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4 text-left">
                {/* COMPONENT: AGENT_AVATAR_INGRESS */}
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-background border border-border/10 flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {getAgentIcon(session.agent_key)}
                  </div>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-background shadow-lg animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-black text-sm uppercase italic tracking-tighter group-hover:text-primary transition-colors">
                        {getAgentName(session.agent_key).replace(" ", "_")}
                      </span>
                      {isActive && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest px-2 h-4"
                        >
                          SYNC_LIVE
                        </Badge>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/40 tabular-nums uppercase whitespace-nowrap italic">
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: false })}_AGO
                    </span>
                  </div>

                  {/* HUD: MESSAGE_PREVIEW */}
                  <div className="flex items-center gap-2">
                    {lastMessage && (
                      <p className="text-[11px] font-medium text-muted-foreground/70 truncate italic leading-none flex-1">
                        {lastMessage.role === "user" ? (
                          <span className="text-primary/60 font-black not-italic mr-1 text-[9px]">YOU:</span>
                        ) : null}
                        {lastMessage.content}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      <span>{session.messages.length}_INTERACTIONS</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center h-full pl-2">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500 ease-out" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
