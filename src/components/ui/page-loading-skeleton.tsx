import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Immersive Pre-render Suite
 * Provides structural blueprints during data handshake latency.
 * Synchronized with 'Executive Logic' geometry and grid protocols.
 */
interface PageLoadingSkeletonProps {
  showNavbar?: boolean;
  showFooter?: boolean;
  variant?: "cards" | "list" | "detail" | "dashboard";
  title?: boolean;
}

export function PageLoadingSkeleton({
  showNavbar = true,
  showFooter = true,
  variant = "cards",
  title = false,
}: PageLoadingSkeletonProps) {
  const renderContent = () => {
    switch (variant) {
      case "cards":
        return <CardGridSkeleton count={6} />;
      case "list":
        return (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-[24px] border border-border/40 bg-card/30 p-5 flex items-center gap-6">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2 opacity-50" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        );
      case "detail":
        return (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="space-y-4">
              <Skeleton className="h-12 w-2/3 rounded-xl" />
              <Skeleton className="h-4 w-1/3 opacity-50" />
            </div>
            <Skeleton className="h-[450px] w-full rounded-[40px] shadow-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-6 w-1/2" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-[200px] w-full rounded-3xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        );
      case "dashboard":
        return (
          <div className="space-y-10">
            {/* Stats Logic Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-[32px] border border-border/40 bg-card/30 p-6 space-y-4 shadow-sm">
                  <Skeleton className="h-3 w-1/2 opacity-50" />
                  <Skeleton className="h-10 w-2/3" />
                </div>
              ))}
            </div>
            {/* Main Registry Node */}
            <div className="rounded-[40px] border border-border/40 bg-card/30 p-10 space-y-8">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl opacity-40" />
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background/50 flex flex-col selection:bg-primary/10">
      {/* Mock Navbar Node */}
      {showNavbar && (
        <div className="h-20 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center px-10 justify-between">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-6 py-12 lg:py-20">
        {title && (
          <div className="mb-12 space-y-4">
            <Skeleton className="h-14 w-80 rounded-2xl" />
            <Skeleton className="h-5 w-[500px] opacity-40" />
          </div>
        )}
        {renderContent()}
      </main>

      {/* Mock Footer Node */}
      {showFooter && (
        <div className="h-64 border-t border-border/10 bg-muted/20 mt-20 flex flex-col items-center justify-center space-y-6">
          <Skeleton className="h-6 w-48 opacity-20" />
          <div className="flex gap-8">
            <Skeleton className="h-4 w-20 opacity-10" />
            <Skeleton className="h-4 w-20 opacity-10" />
            <Skeleton className="h-4 w-20 opacity-10" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SectionSkeleton: Inline logic disclosure
 */
export function SectionSkeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-2xl opacity-60" />
      ))}
    </div>
  );
}

/**
 * CardGridSkeleton: Primary artifact distribution blueprint
 */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className = "",
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-8", gridClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[40px] border border-border/40 bg-card/30 p-8 space-y-6 shadow-sm">
          <Skeleton className="h-48 w-full rounded-[28px]" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full opacity-50" />
            <Skeleton className="h-4 w-2/3 opacity-50" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
