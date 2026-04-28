import { LucideIcon, MessageCircle, Coins, Bot, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: AI Faculty Interface Node
 * CTO Reference: Authoritative component for agent initialization and session synchronization.
 */

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  color: string;
  bgColor: string;
  expertise: string[];
  creditCost?: number;
  avatarUrl?: string | null;
  hasActiveSession?: boolean;
  onClick: () => void;
  onResume?: () => void;
}

export function AgentCard({
  name = "AI_NODE",
  description,
  icon: IconComponent,
  color,
  bgColor,
  creditCost,
  avatarUrl,
  hasActiveSession,
  onClick,
  onResume,
}: AgentCardProps) {
  // PROTOCOL: Hardened Initial Extraction
  const initials = (name || "AI")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isHexProtocol = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-500 rounded-[32px] border-2",
        "bg-card/30 backdrop-blur-xl border-border/40 hover:border-primary/40 overflow-hidden shadow-2xl hover:shadow-primary/5",
        hasActiveSession && "border-emerald-500/20",
      )}
      onClick={onClick}
    >
      {/* HUD: NEURAL_GLOW */}
      <div
        className="absolute -top-16 -right-16 w-32 h-32 blur-[64px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 rounded-full"
        style={{ backgroundColor: isHexProtocol(color) ? color : "hsl(var(--primary))" }}
      />

      <CardContent className="p-6 flex flex-col items-center text-center gap-4 text-left">
        {/* COMPONENT: AGENT_IDENTITY */}
        <div className="relative">
          <Avatar className="h-20 w-20 ring-4 ring-background shadow-2xl transition-transform duration-700 group-hover:scale-110">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
            <AvatarFallback
              className="font-black italic uppercase tracking-tighter"
              style={{
                backgroundColor: isHexProtocol(bgColor) ? bgColor : "hsl(var(--primary) / 0.1)",
                color: isHexProtocol(color) ? color : "hsl(var(--primary))",
              }}
            >
              {IconComponent ? <IconComponent className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>

          {/* TELEMETRY: ACTIVE_SESSION_PING */}
          {hasActiveSession && (
            <div className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <div className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-background shadow-lg items-center justify-center">
                <ShieldCheck className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* HUD: TEXT_METADATA */}
        <div className="space-y-1.5 h-[64px]">
          <h3 className="font-black text-base uppercase italic tracking-tighter line-clamp-1 group-hover:text-primary transition-colors leading-none">
            {name.replace(" ", "_")}
          </h3>
          <p className="text-[10px] text-muted-foreground/80 line-clamp-3 leading-relaxed font-bold uppercase tracking-widest italic px-1">
            {description}
          </p>
        </div>

        {/* NODE: TRANSACTION_BADGE */}
        <div className="flex items-center justify-center h-8">
          {creditCost !== undefined ? (
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase italic tracking-[0.2em] gap-1.5 border-primary/20 bg-primary/5 px-3 h-7 shadow-inner"
            >
              <Coins className="h-3 w-3 text-primary fill-current opacity-70" />
              {creditCost}_CREDITS
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase italic tracking-[0.2em] text-emerald-600 border-emerald-500/20 bg-emerald-500/5 px-3 h-7"
            >
              <Zap className="h-3 w-3 fill-current" /> ACCESS_OPEN
            </Badge>
          )}
        </div>

        {/* INGRESS: ACTION_TRIGGER */}
        <div className="w-full pt-2">
          {hasActiveSession && onResume ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full h-11 text-[10px] font-black uppercase italic tracking-[0.2em] rounded-2xl transition-all hover:bg-emerald-500 hover:text-white shadow-lg active:scale-95 gap-3"
              onClick={(e) => {
                e.stopPropagation();
                onResume();
              }}
            >
              <MessageCircle className="h-4 w-4 fill-current opacity-30" />
              RESUME_SESSION
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full h-11 text-[10px] font-black uppercase italic tracking-[0.2em] rounded-2xl shadow-[0_10px_20px_rgba(var(--primary),0.2)] transition-all hover:scale-[1.02] active:scale-95 gap-3"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              INITIALIZE_SYNC
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
