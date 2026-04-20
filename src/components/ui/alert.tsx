import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Semantic Information Nodes
 * Provides high-visibility feedback for system states and logic validations.
 */
const alertVariants = cva(
  "relative w-full rounded-2xl border p-5 shadow-sm transition-all duration-300 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background/50 backdrop-blur-md text-foreground border-border/40",
        destructive:
          "bg-rose-500/[0.03] border-rose-500/20 text-rose-600 dark:border-rose-500/30 [&>svg]:text-rose-600",
        warning:
          "bg-amber-500/[0.03] border-amber-500/20 text-amber-700 dark:border-amber-500/30 [&>svg]:text-amber-600",
        success:
          "bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-700 dark:border-emerald-500/30 [&>svg]:text-emerald-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1.5 font-black uppercase text-[10px] tracking-[0.2em] leading-none", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-xs font-medium leading-relaxed opacity-90", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
