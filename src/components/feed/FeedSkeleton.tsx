import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Structural Loading Node (FeedSkeleton)
 * CTO Reference: High-fidelity ghost state for feed hydration cycles.
 */
export function FeedSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* INFRASTRUCTURE: Header Banner Node */}
      <div className="relative overflow-hidden rounded-[32px] aspect-[3/1] sm:aspect-[4/1] bg-muted/20 border-2 border-border/10">
        <div className="absolute inset-0 flex items-center px-8 gap-6">
          <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full ring-4 ring-background/10" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 sm:w-64 rounded-lg" />
            <Skeleton className="h-4 w-24 sm:w-40 opacity-40 rounded-md" />
          </div>
        </div>
      </div>

      {/* INTELLIGENCE: Strategy Carousel Node */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-3 w-24 opacity-30 rounded-sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-5 overflow-hidden -mx-4 px-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[300px] sm:w-[340px] p-6 rounded-[28px] border-2 border-border/10 bg-card/30 space-y-5"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-sm" />
                <Skeleton className="h-4 w-full rounded-sm" />
                <Skeleton className="h-4 w-2/3 opacity-40 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEGMENTATION: Tactical Filter Node */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-2 p-1.5 bg-muted/10 rounded-[20px] border-2 border-border/10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center py-3 space-y-3">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-2 w-10 rounded-full opacity-30" />
            </div>
          ))}
        </div>
      </div>

      {/* ARTIFACTS: Feed Card Pipeline */}
      <div className="space-y-8">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden border-2 border-border/10 rounded-[32px] bg-card/30">
            {/* Media Area Placeholder */}
            <Skeleton className="aspect-[2.5/1] w-full rounded-none opacity-40" />

            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-7 w-full rounded-lg" />
                <Skeleton className="h-7 w-3/4 rounded-lg opacity-60" />
              </div>

              {/* Attributes Node */}
              <div className="flex gap-3">
                <Skeleton className="h-6 w-20 rounded-xl" />
                <Skeleton className="h-6 w-24 rounded-xl" />
                <Skeleton className="h-6 w-16 rounded-xl" />
              </div>

              {/* Match Reason Logic Node */}
              <div className="p-5 bg-primary/5 rounded-[20px] border-2 border-primary/5">
                <div className="flex gap-4 items-start">
                  <Skeleton className="h-5 w-5 rounded-full mt-0.5 shrink-0 opacity-50" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-full rounded-sm" />
                    <Skeleton className="h-3 w-5/6 rounded-sm opacity-40" />
                  </div>
                </div>
              </div>

              {/* Action Node Strip */}
              <div className="flex gap-4 pt-6 border-t-2 border-border/5">
                <Skeleton className="h-12 flex-1 rounded-2xl" />
                <Skeleton className="h-12 w-14 rounded-2xl opacity-50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
