import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Precision Parameter Tuning Hub (Slider)
 * Hardened WAI-ARIA compliant scalar slider securing structural layout heights and thumb boundary tracks from scaling jitters.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Extract and insulate array mapping lookups to accommodate multi-thumb configurations cleanly
  const valueArrayDataPayload = props.value || props.defaultValue || [0];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center h-5 transform-gpu antialiased cursor-pointer disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {/* HUD LEVEL 1: TRACK TIMING BASELINE STRUT */}
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted/60 pointer-events-none">
        <SliderPrimitive.Range className="absolute h-full bg-primary transition-colors duration-150" />
      </SliderPrimitive.Track>

      {/* HUD LEVEL 2: COMPOSITE SELECTION GRAB TARGET MATRIX */}
      {valueArrayDataPayload.map((_, indexNum) => (
        <SliderPrimitive.Thumb
          key={`slider-thumb-node-index-${indexNum}`}
          className={cn(
            "block h-4 w-4 rounded-full border border-primary bg-background shadow-xs transition-colors duration-150 outline-none focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring cursor-grab active:cursor-grabbing shrink-0 transform-gpu p-0 m-0",
            "hover:bg-accent focus-visible:bg-accent data-[disabled]:pointer-events-none",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = "Slider_Core_Precision_Node";

export { Slider };
