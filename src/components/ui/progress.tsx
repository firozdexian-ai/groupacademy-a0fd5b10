import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Logic Progression Node
 * High-fidelity telemetry indicator for curriculum advancement and system handshakes.
 * Built on Radix UI for strict accessibility and performance.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/10 transition-all", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out relative",
        "after:absolute after:inset-0 after:bg-white/20 after:animate-pulse",
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {/* Internal Kinetic Glow */}
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/30 to-transparent blur-md" />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
