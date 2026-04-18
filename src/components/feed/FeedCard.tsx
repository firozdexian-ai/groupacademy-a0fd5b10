import { ThumbsUp, ThumbsDown, Play, BookOpen, Newspaper, FileText, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/hooks/useFeedRecommendations";

interface FeedCardProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

export function FeedCard({ item, onInterested, onNotInterested }: FeedCardProps) {
  // CTO Fix: Optimized icon mapping to reduce switch complexity in render
  const iconMap = {
    video: <Play className="h-3 w-3 fill-current" />,
    course: <BookOpen className="h-3 w-3" />,
    blog: <Newspaper className="h-3 w-3" />,
    post: <FileText className="h-3 w-3" />,
  };

  const styleMap = {
    video: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/30",
    course: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/30",
    blog: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30",
    post: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/30",
  };

  const currentType = (item.type as keyof typeof iconMap) || "post";
  const score = item.matchScore || 0;

  return (
    <Card className="group relative overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:border-primary/40 border-border/40 bg-card/50 backdrop-blur-sm">
      {/* High Match Glow Effect */}
      {score >= 85 && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
      )}

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-4 flex-1">
          {/* Thumbnail / Placeholder */}
          <div className="relative shrink-0">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-xl ring-1 ring-border shadow-sm transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className={cn(
                  "w-20 h-20 rounded-xl flex items-center justify-center ring-1 ring-border shadow-inner bg-muted/20",
                  styleMap[currentType],
                )}
              >
                {iconMap[currentType]}
              </div>
            )}
            <Badge
              className={cn(
                "absolute -bottom-2 -right-1 px-1.5 py-0 h-5 text-[9px] font-bold uppercase tracking-tight shadow-md",
                styleMap[currentType],
              )}
            >
              {item.type}
            </Badge>
          </div>

          {/* Content Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              {item.company && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                  <Building2 className="h-2.5 w-2.5" />
                  {item.company}
                </div>
              )}
            </div>

            <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors tracking-tight">
              {item.title}
            </h3>

            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">{item.description}</p>

            {/* AI Match Module */}
            {item.matchScore !== undefined && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles
                      className={cn(
                        "h-3 w-3 animate-pulse",
                        score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-tighter",
                        score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-muted-foreground",
                      )}
                    >
                      {score}% Strategic Match
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                      score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-muted-foreground/40",
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
                {item.matchReason && (
                  <p className="text-[9px] text-muted-foreground italic font-medium leading-tight">
                    "{item.matchReason}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Infrastructure */}
        <div className="grid grid-cols-2 gap-2 mt-6 pt-3 border-t border-border/40">
          <Button size="sm" className="h-8 text-[11px] font-bold gap-1.5 rounded-lg shadow-sm" onClick={onInterested}>
            <ThumbsUp className="h-3 w-3" />
            Engage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] font-bold gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={onNotInterested}
          >
            <ThumbsDown className="h-3 w-3" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
