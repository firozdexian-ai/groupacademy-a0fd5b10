import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Status Telemetry Indicator Nodes (Badge)
 * Hardened operational badge rendering semantic state tags, system categorizations, and validation indices.
 * Version: Launch Candidate · Phase Z0 Architectural Balance Lock
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded px-1.5 h-5 font-mono text-[9px] font-extrabold uppercase tracking-wide border select-none pointer-events-none leading-none shadow-xs antialiased transition-colors duration-200 focus:outline-none focus:ring-0 shrink-0 tabular-nums w-fit block pt-0.5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border-border/40 bg-muted/40 text-muted-foreground/80 hover:bg-muted hover:text-foreground",
        destructive: "border-destructive/15 bg-destructive/10 text-destructive dark:text-destructive-foreground/90",
        outline: "border-border/60 bg-transparent text-foreground/80 hover:bg-muted/30",
        success: "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning: "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div role="status" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
