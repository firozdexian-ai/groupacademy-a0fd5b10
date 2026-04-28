import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, Zap, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Advisory Node (CareerInsightsCard)
 * CTO Reference: Primary ingestion point for AI-generated career artifacts.
 */

interface CareerInsightsCardProps {
  insights: string[];
}

export function CareerInsightsCard({ insights }: CareerInsightsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!insights || insights.length === 0) return null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        "bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.03]",
        "border-2 border-primary/10 hover:border-primary/30 shadow-xl rounded-[32px]",
      )}
    >
      {/* Decorative Neural Blur */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />

      <CardContent className="p-6">
        {/* EXECUTIVE HEADER NODES */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between group outline-none focus:ring-0"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={cn(
                  "p-3 rounded-2xl bg-primary/10 text-primary transition-all duration-300",
                  "group-hover:bg-primary group-hover:text-white group-hover:rotate-12 group-hover:scale-110 shadow-lg",
                )}
              >
                <Lightbulb className="h-6 w-6 fill-current opacity-80" />
              </div>
              <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg uppercase italic tracking-tighter text-foreground">
                  Neural Career Strategy
                </h3>
                {isExpanded && <PulseNode />}
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60 italic">
                Synchronized with your talent node
              </p>
            </div>
          </div>

          <div
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl border-2 border-border/40 transition-all",
              "group-hover:border-primary group-hover:text-primary bg-background/50 backdrop-blur-sm",
              isExpanded ? "rotate-0" : "rotate-180",
            )}
          >
            <ChevronUp className="h-5 w-5" />
          </div>
        </button>

        {/* DYNAMIC PAYLOAD INGRESS */}
        <div
          className={cn(
            "grid transition-all duration-500 ease-in-out",
            isExpanded ? "grid-rows-[1fr] opacity-100 mt-8" : "grid-rows-[0fr] opacity-0 mt-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-6">
              <ul className="space-y-5">
                {insights.map((insight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-5 group/item animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-xl bg-background border-2 border-primary/20",
                        "text-primary text-xs font-black flex items-center justify-center mt-0.5",
                        "shadow-md transition-all group-hover/item:bg-primary group-hover/item:text-white group-hover/item:scale-110",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[15px] text-foreground/90 leading-relaxed font-semibold italic">{insight}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* STRATEGIC ADVANTAGE FOOTER */}
              <div className="mt-8 pt-6 border-t-2 border-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                  <Zap className="h-4 w-4 text-amber-500 fill-current" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
                    AI Analysis: High-Intensity Alignment Locked
                  </span>
                </div>
                <button className="group flex items-center gap-2 text-[11px] text-muted-foreground hover:text-primary transition-colors font-black uppercase italic tracking-widest">
                  <Target className="h-4 w-4" />
                  Request Deep Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Atomic Pulse Indicator for active neural analysis.
 */
function PulseNode() {
  return (
    <span className="flex h-2.5 w-2.5 relative">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></span>
    </span>
  );
}
