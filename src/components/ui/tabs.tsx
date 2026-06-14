import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Logic Partition Protocol Switchboard (Tabs)
 * Hardened WAI-ARIA compliant tab router ensuring zero visual layout shifts during viewport panel transitions.
 * Version: Launch Candidate Â· Phase Z0 Geometric Balance Lock
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted/40 p-1 text-muted-foreground/60 select-none pointer-events-auto transform-gpu gap-1 shrink-0 block",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "Tabs_Core_List_Node";

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 h-7 text-xs font-bold text-muted-foreground/70 outline-none transition-all duration-150 transform-gpu cursor-pointer select-none leading-none pt-0.5 border border-transparent",
      "focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border/10 data-[state=active]:font-extrabold shadow-2xs",
      "hover:text-foreground hover:bg-background/30",
      "disabled:pointer-events-none disabled:opacity-20",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "Tabs_Core_Trigger_Node";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3.5 outline-none focus:outline-none focus-visible:outline-none select-text text-left block w-full",
      "data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in duration-100 transform-gpu",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "Tabs_Core_Content_Node";

export { Tabs, TabsList, TabsTrigger, TabsContent };

