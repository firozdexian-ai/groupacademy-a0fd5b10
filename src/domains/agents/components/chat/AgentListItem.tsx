import { useMemo } from "react";
import { formatDistanceToNow, isValid } from "date-fns";
import { Coins, ArrowRight, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { Badge } from "@/components/ui/badge";
import { trackError } from "@/lib/errorTracking";

/**
 * Group Academy — Career Guidance System: Agent Messaging Ledger Row
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/chat (Sidebar Agent List Panel Surface)
 * Operations Mode: Automated Efficiency high-performance row tracking active interactions.
 */

interface AgentListItemProps {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  avatarUrl?: string | null;
  creditCost?: number;
  category?: string;
  isActive?: boolean;
  isCompanyAgent?: boolean;
  isCreatorAgent?: boolean;
  companyName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  expertise?: string[];
  onClick: () => void;
}

export function AgentListItem({
  name = "Agent Profile",
  description = "No configuration parameters provided.",
  icon,
  bgColor,
  iconColor,
  avatarUrl,
  creditCost = 10,
  isActive = false,
  isCompanyAgent = false,
  isCreatorAgent = false,
  companyName,
  lastMessage,
  lastMessageTime,
  expertise = [],
  onClick,
}: AgentListItemProps) {
  // --- PHASE: SAFE_TEMPORAL_RESOLUTION ---
  const timeSyncLabel = useMemo(() => {
    if (!lastMessageTime) return null;
    const resolvedDate = new Date(lastMessageTime);

    if (!isValid(resolvedDate)) return null;

    try {
      return formatDistanceToNow(resolvedDate, { addSuffix: true });
    } catch (err: unknown) {
      trackError("agent-list-item-temporal-sync-failure", { error: err.message, lastMessageTime });
      return null;
    }
  }, [lastMessageTime]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-4 p-4 transition-all duration-300 border-b border-border/40 text-left outline-none select-none relative overflow-hidden",
        "hover:bg-muted/40 active:scale-[0.995] focus-visible:bg-muted/30 group",
        isActive && "bg-primary/[0.02]",
      )}
    >
      {/* Active Selection Visual State Pin */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary animate-in slide-in-from-left duration-300" />
      )}

      {/* Component Avatar Node Wrapper */}
      <AgentAvatar
        name={name}
        avatarUrl={avatarUrl}
        icon={icon}
        bgColor={bgColor}
        iconColor={iconColor}
        size="md"
        isOnline={isActive}
        isCompanyAgent={isCompanyAgent}
        isCreatorAgent={isCreatorAgent}
        companyName={companyName}
        className="shrink-0 transition-transform duration-300 group-hover:scale-102"
      />

      {/* Profile Metadata Stack Frame */}
      <div className="flex-1 min-w-0 py-0.5 pr-1">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors leading-none">
              {name}
            </h3>
            {isActive && (
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none text-[9px] font-bold px-1.5 py-0 rounded-full shrink-0 animate-pulse"
              >
                Active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
            {timeSyncLabel ? (
              <span className="text-xs text-muted-foreground/60 tracking-tight tabular-nums">{timeSyncLabel}</span>
            ) : (
              !lastMessage && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                  <Coins className="h-3 w-3 text-primary opacity-70" />
                  <span className="font-bold text-primary">{creditCost} Credits</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Dynamic Context Block: Message Pipeline vs Exploratory Content */}
        {lastMessage ? (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1 duration-200 mt-1">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 fill-muted-foreground/10" />
            <p className="text-xs text-muted-foreground line-clamp-1 leading-normal">{lastMessage}</p>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            <p className="text-xs text-muted-foreground/80 line-clamp-1 leading-normal">{description}</p>
            {Array.isArray(expertise) && expertise.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {expertise.slice(0, 3).map((tag, idx) => {
                  const tagStableKey = `expertise-tag-${tag}-${idx}`;
                  return (
                    <span
                      key={tagStableKey}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 group-hover:border-primary/20 group-hover:text-primary/80 transition-colors duration-200"
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row Affordance Interface Indicator */}
      <div className="flex items-center self-stretch pl-1">
        <div className="p-1 rounded-lg bg-transparent group-hover:bg-primary/5 transition-colors duration-200">
          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300 ease-out" />
        </div>
      </div>
    </button>
  );
}

export default AgentListItem;


