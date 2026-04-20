import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Precision Parameter Protocol
 * High-fidelity tuning node for real-time manipulation of scalar logic values.
 * Built on Radix UI for robust touch-physics and accessibility.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center group", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/10 transition-all group-hover:h-2">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>

    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-lg border-2 border-primary bg-background shadow-lg ring-offset-background transition-all duration-200",
        "hover:scale-125 hover:shadow-primary/20 cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
        "disabled:pointer-events-none disabled:opacity-20",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
