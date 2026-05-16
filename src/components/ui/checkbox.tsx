import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Validation Toggle Core Interface (Checkbox)
 * Hardened accessible form toggle control supporting high-fidelity state maps and zero Cumulative Layout Shift (CLS).
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded border border-border/60 bg-background/50 text-primary-foreground transition-all duration-200 shadow-inner antialiased transform-gpu items-center justify-center flex cursor-pointer",
      "hover:border-border/100 hover:bg-accent",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
      "disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current animate-in zoom-in-95 fade-in duration-100 h-full w-full block",
      )}
    >
      <Check className="h-3 w-3 stroke-[3px] shrink-0 select-none pointer-events-none" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = "Checkbox_Core_Validation_Node";

export { Checkbox };
