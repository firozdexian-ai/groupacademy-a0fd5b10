import { useState } from "react";
import { ThumbsUp, Lightbulb, PartyPopper, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

interface ReactionBarProps {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
  /** When true, renders buttons inline without wrapper borders (parent handles layout) */
  inline?: boolean;
}

const REACTION_CONFIG: Record<
  ReactionType,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    activeBg: string;
  }
> = {
  like: { icon: ThumbsUp, label: "Like", color: "text-blue-600", activeBg: "bg-blue-50" },
  insightful: { icon: Lightbulb, label: "Insight", color: "text-amber-500", activeBg: "bg-amber-50" },
  celebrate: { icon: PartyPopper, label: "Clap", color: "text-emerald-500", activeBg: "bg-emerald-50" },
  support: { icon: Heart, label: "Love", color: "text-rose-500", activeBg: "bg-rose-50" },
};

export function ReactionBar({ reactions, userReaction, onReact, disabled, inline = false }: ReactionBarProps) {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  const reactionButtons = (Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG.like][]).map(
    ([type, config]) => {
      const Icon = config.icon;
      const isActive = userReaction === type;

      return (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={`${config.label} post`}
          className={cn(
            "flex-1 h-9 text-[11px] font-bold gap-1.5 transition-all duration-200 rounded-xl px-2",
            isActive ? cn(config.color, config.activeBg, "scale-105") : "text-muted-foreground hover:bg-muted/50",
            !isActive && hoveredReaction === type && "scale-105",
          )}
          onClick={(e) => {
            e.preventDefault();
            onReact(type);
          }}
          onMouseEnter={() => setHoveredReaction(type)}
          onMouseLeave={() => setHoveredReaction(null)}
        >
          <Icon className={cn("h-4 w-4 transition-transform", isActive && "fill-current scale-110")} />
          <span className={cn("hidden lg:inline uppercase tracking-tighter")}>{config.label}</span>
        </Button>
      );
    },
  );

  if (inline) {
    return <div className="flex items-center gap-1 w-full">{reactionButtons}</div>;
  }

  // Standalone mode for detailed views or summaries
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  return (
    <div className="space-y-3 w-full">
      {totalReactions > 0 && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
          <div className="flex -space-x-1.5">
            {topReactions.map((type) => {
              const config = REACTION_CONFIG[type];
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center bg-card border-2 border-background shadow-sm",
                    config.color,
                  )}
                >
                  <Icon className="h-2.5 w-2.5 fill-current" />
                </div>
              );
            })}
          </div>
          <span>{totalReactions.toLocaleString()} total interactions</span>
        </div>
      )}
      <div className="flex items-center gap-1 border-t border-border/40 pt-3">{reactionButtons}</div>
    </div>
  );
}
