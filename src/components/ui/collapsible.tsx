import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Information Density Toggle Framework (Collapsible)
 * Authoritative WAI-ARIA compliant disclosure block regulating cognitive load profiles across workspace panels.
 * Version: Launch Candidate Â· Phase Z0 Hardened
 */
const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "outline-none focus-visible:text-primary cursor-pointer select-none transition-colors duration-200 block text-left",
      className,
    )}
    {...props}
  />
));
CollapsibleTrigger.displayName = "Collapsible_Core_Trigger_Node";

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down select-text transform-gpu antialiased w-full block",
      className,
    )}
    {...props}
  />
));
CollapsibleContent.displayName = "Collapsible_Core_Content_Node";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

