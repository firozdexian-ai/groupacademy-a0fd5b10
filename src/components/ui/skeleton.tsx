import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Kinetic Pre-render Blueprint Node (Skeleton)
 * Hardened atomic placeholder holding spatial canvas footprints cleanly during data latency intervals.
 * Version: Launch Candidate Â· Phase Z0 Lifecycle & Animation Performance Locked
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="placeholder"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-muted/50 min-h-[4px] min-w-[4px] h-full w-full block select-none pointer-events-none transform-gpu antialiased shrink-0 border border-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

