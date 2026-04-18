import { useRef } from "react";
import { Sparkles, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsightCard } from "./InsightCard";
import { cn } from "@/lib/utils";

interface CareerInsightsCarouselProps {
  insights: string[];
  className?: string;
}

export function CareerInsightsCarousel({ insights, className }: CareerInsightsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!insights || insights.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    // CTO Note: Dynamically calculate width to handle different screen sizes
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("group/carousel space-y-4 py-2", className)}>
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">AI Growth Strategy</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              {insights.length} Personalized Insights
            </p>
          </div>
        </div>

        {/* CTO Fix: Enhanced Navigation Visibility */}
        {insights.length > 1 && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-muted-foreground/20 hover:bg-primary hover:text-white transition-all shadow-sm"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-muted-foreground/20 hover:bg-primary hover:text-white transition-all shadow-sm"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-4 -mx-4 px-4",
          "scrollbar-hide snap-x snap-mandatory",
          "will-change-scroll transform-gpu", // GPU acceleration
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {insights.map((insight, index) => (
          <div
            key={index}
            className="snap-start shrink-0 first:pl-0 last:pr-4"
            style={{ width: "calc(100% - 48px)", maxWidth: "320px" }}
          >
            <InsightCard
              insight={insight}
              index={index}
              className="h-full border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
