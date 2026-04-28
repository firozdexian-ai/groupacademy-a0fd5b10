import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsightCard } from "./InsightCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * GroUp Academy: Neural Intelligence Stack
 * CTO Reference: High-density vertical ingestion node with predictive visual decay.
 */

interface CareerInsightsStackProps {
  insights: string[];
  className?: string;
  maxVisible?: number;
}

export function CareerInsightsStack({ insights, className, maxVisible = 3 }: CareerInsightsStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!insights || insights.length === 0) return null;

  const visibleInsights = isExpanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  return (
    <div className={cn("space-y-6 py-4 animate-in fade-in duration-700", className)}>
      {/* EXECUTIVE HUB HEADER */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4 text-left">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Target className="h-5 w-5 fill-current opacity-80" />
            </div>
            <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-lg uppercase italic tracking-tighter leading-none text-foreground">
              Strategic Intelligence
            </h3>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-5 px-2 rounded-md font-black text-[9px] uppercase italic border-primary/20 bg-primary/5 text-primary"
              >
                {insights.length} NODES_SYNCED
              </Badge>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                Predictive Analysis Active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VERTICAL PROTOCOL STACK */}
      <div
        className={cn(
          "space-y-4 relative transition-all duration-500 ease-in-out",
          !isExpanded &&
            hasMore &&
            "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-20 after:bg-gradient-to-t after:from-background after:to-transparent after:pointer-events-none after:z-10",
        )}
      >
        {visibleInsights.map((insight, index) => {
          const isLastVisible = !isExpanded && index === maxVisible - 1;

          return (
            <div
              key={index}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <InsightCard
                insight={insight}
                index={index}
                fullWidth
                className={cn(
                  "border-2 transition-all duration-500 rounded-[24px]",
                  isExpanded
                    ? "border-primary/10 bg-background hover:border-primary/30"
                    : "border-primary/5 bg-muted/5",
                  isLastVisible && "opacity-40 scale-[0.97] blur-[1px] translate-y-[-8px]",
                )}
              />
            </div>
          );
        })}
      </div>

      {/* INTERACTIVE EXPANSION GATE */}
      {hasMore && (
        <div className="pt-4 px-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full h-14 rounded-2xl transition-all duration-300 font-black uppercase italic text-[11px] tracking-widest gap-3 shadow-sm",
              "border-2 border-dashed border-border/60 hover:border-primary hover:bg-primary/5 hover:text-primary",
              isExpanded ? "bg-muted/30 border-primary/20" : "bg-background",
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse Intelligence Nodes
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                Sync {insights.length - maxVisible} Additional Analysis Units
                <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
