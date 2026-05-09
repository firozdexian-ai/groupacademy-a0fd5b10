import { useEffect, useMemo, useRef } from "react";
import { Loader2, Briefcase, Coins, Clock, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRankedGigs } from "@/hooks/useRankedGigs";

interface Props {
  talentId: string | null | undefined;
  search?: string;
}

/**
 * Infinite, zero-latency unified gig feed.
 * Mirrors InfiniteJobsList — keyset pagination + IntersectionObserver sentinel.
 */
export function InfiniteGigsList({ talentId, search }: Props) {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useRankedGigs(talentId);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => {
    const all = (data?.pages ?? []).flat();
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((g) => g.title?.toLowerCase().includes(q));
  }, [data, search]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center border border-dashed rounded-2xl bg-muted/20">
        <p className="text-sm text-muted-foreground italic">
          No open gigs match right now. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((g) => (
        <button
          key={`${g.kind}-${g.gig_id}`}
          type="button"
          onClick={() =>
            navigate(g.kind === "marketplace" ? `/app/marketplace/${g.gig_id}` : `/app/gigs?tab=tasks`)
          }
          className="w-full text-left rounded-2xl border border-border/50 bg-card/60 hover:border-primary/40 hover:shadow-md transition-all p-3 active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                  {g.kind}
                </Badge>
                {g.match_score > 0 && (
                  <Badge className="text-[10px] h-5 bg-primary/15 text-primary hover:bg-primary/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Match {Math.round(g.match_score)}
                  </Badge>
                )}
                {g.skill_category && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    {g.skill_category}
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-bold leading-tight line-clamp-1">{g.title}</h3>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {g.credits != null && (
                  <span className="flex items-center gap-1 font-bold text-amber-700">
                    <Coins className="h-3 w-3" />
                    {g.credits}cr
                  </span>
                )}
                {g.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(g.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        </button>
      ))}

      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {!hasNextPage && items.length > 6 && (
          <p className="text-[10px] text-muted-foreground italic">You're all caught up.</p>
        )}
      </div>
    </div>
  );
}
