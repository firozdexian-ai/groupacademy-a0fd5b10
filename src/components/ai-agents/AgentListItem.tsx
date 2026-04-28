import { formatDistanceToNow, isValid } from "date-fns";
import { Coins, ArrowRight, MessageCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

/**
 * GroUp Academy: Agent Messaging Ledger Node
 * CTO Reference: High-density interaction node for active threads and discovery.
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
  companyName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  expertise?: string[];
  onClick: () => void;
}

export function AgentListItem({
  name = "AGENT_NODE",
  description,
  icon,
  bgColor,
  iconColor,
  avatarUrl,
  creditCost = 10,
  isActive = false,
  isCompanyAgent = false,
  companyName,
  lastMessage,
  lastMessageTime,
  expertise = [],
  onClick,
}: AgentListItemProps) {
  // PROTOCOL: Safe Temporal Resolution
  const getTimeSync = () => {
    if (!lastMessageTime) return null;
    const date = new Date(lastMessageTime);
    return isValid(date) ? formatDistanceToNow(date, { addSuffix: false }) : null;
  };

  const timeSyncLabel = getTimeSync();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-4 p-5 transition-all duration-500 border-b border-border/10",
        "hover:bg-muted/30 active:scale-[0.99] group relative overflow-hidden text-left",
        isActive && "bg-primary/[0.02]",
      )}
    >
      {/* HUD: ACTIVE_SYNC_SIDEBAR */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-in slide-in-from-left duration-700" />
      )}

      {/* COMPONENT: IDENTITY_INGRESS */}
      <AgentAvatar
        name={name}
        avatarUrl={avatarUrl}
        icon={icon}
        bgColor={bgColor}
        iconColor={iconColor}
        size="lg"
        isOnline={isActive}
        isCompanyAgent={isCompanyAgent}
        companyName={companyName}
        className="shrink-0 transition-transform duration-500 group-hover:scale-105"
      />

      {/* VIEWPORT: METADATA_LEDGER */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-black text-[13px] uppercase italic tracking-tight truncate leading-none group-hover:text-primary transition-colors">
              {name.replace(" ", "_")}
            </h3>
            {isActive && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase tracking-widest h-4 px-1.5 animate-pulse">
                SYNC_LIVE
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {timeSyncLabel ? (
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic tabular-nums">
                {timeSyncLabel}_AGO
              </span>
            ) : (
              !lastMessage && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                  <Coins className="h-2.5 w-2.5 text-primary opacity-60" />
                  <span className="text-[9px] font-black text-primary/80">{creditCost} CR</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* DYNAMIC_CONTENT: Thread vs Discovery */}
        {lastMessage ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-500">
            <MessageCircle className="h-3 w-3 shrink-0 text-primary/40 fill-current" />
            <p className="text-xs font-medium text-muted-foreground/70 truncate italic leading-none">{lastMessage}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] text-muted-foreground/60 line-clamp-1 leading-none font-bold uppercase tracking-wide">
              {description}
            </p>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {expertise.slice(0, 3).map((node) => (
                  <span
                    key={node}
                    className="text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter bg-muted/50 text-muted-foreground/40 border border-border/20 group-hover:border-primary/20 group-hover:text-primary/60 transition-colors"
                  >
                    {node}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* HUD: TRANSACTION_AFFORDANCE */}
      <div className="flex items-center self-stretch pl-2">
        <div className="p-2 rounded-xl bg-muted/0 group-hover:bg-primary/5 transition-colors">
          <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1.5 transition-all duration-500 ease-out" />
        </div>
      </div>
    </button>
  );
}
