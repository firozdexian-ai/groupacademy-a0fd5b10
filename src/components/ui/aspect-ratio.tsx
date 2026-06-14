import * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Structural Media Geometric Anchor (AspectRatio)
 * Hardened primitive layout ensuring visual asset nodes maintain proportional configuration
 * integrity across dynamic responsive layout grids, completely eliminating CLS (Cumulative Layout Shift).
 * Version: Launch Candidate Â· Phase Z0 Layout Stability Lock
 */
const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>
>(({ className, ratio = 16 / 9, ...props }, ref) => (
  <AspectRatioPrimitive.Root
    ref={ref}
    ratio={ratio}
    className={cn("w-full h-full transform-gpu antialiased select-none pointer-events-auto overflow-hidden", className)}
    {...props}
  />
));

AspectRatio.displayName = "AspectRatio_Core_Anchor_Node";

export { AspectRatio };

