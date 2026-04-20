import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Decision Node
 * High-precision selection system optimized for mutually exclusive logic paths.
 * Built on Radix UI for strict accessibility and keyboard focus management.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-4", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "peer aspect-square h-5 w-5 rounded-full border-2 border-primary/40 bg-background/50 text-primary ring-offset-background transition-all duration-300",
        "hover:border-primary/60 hover:bg-primary/5",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5",
        "disabled:cursor-not-allowed disabled:opacity-20",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center animate-in zoom-in-50 fade-in duration-300">
        <Circle className="h-2.5 w-2.5 fill-current text-primary shadow-sm" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
