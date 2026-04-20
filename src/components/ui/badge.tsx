import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Status Telemetry Nodes
 * Provides concise visual feedback for object states and categorizations.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border-border/40 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20",
        outline: "border-border/60 bg-transparent text-foreground hover:bg-muted/30",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
