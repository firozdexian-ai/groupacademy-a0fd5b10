import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: State Intercept Protocol
 * High-fidelity binary instrument for persistent logic state toggling.
 * Synchronized with the 2026 'Executive Logic' depth and interaction tokens.
 */

const toggleVariants = cva(
  "inline-flex items-center justify-center transition-all duration-300 outline-none disabled:pointer-events-none disabled:opacity-20 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-lg data-[state=on]:shadow-primary/20 focus-visible:ring-4 focus-visible:ring-primary/10",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-primary/10 hover:text-primary",
        outline:
          "border-2 border-border/40 bg-background/50 hover:border-primary/40 hover:bg-primary/5 active:scale-95",
      },
      size: {
        default: "h-12 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest",
        sm: "h-10 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
        lg: "h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
