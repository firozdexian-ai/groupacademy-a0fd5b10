import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Artifact Enclosure Interface Node (Card)
 * Hardened atomic container isolating high-fidelity curriculum blocks, talent metrics, and profile dashboards.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border/40 bg-card/95 backdrop-blur-md text-card-foreground shadow-xs transition-colors duration-300 hover:border-border/80 text-left antialiased select-none sm:select-text transform-gpu block overflow-hidden w-full",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card_Core_Enclosure_Node";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0 flex flex-col space-y-1.5",
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "Card_Core_Header_Node";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none pt-0.5",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "Card_Core_Title_Node";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-normal block pt-0.5 select-text",
        className,
      )}
      {...props}
    />
  ),
);
CardDescription.displayName = "Card_Core_Description_Node";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center font-semibold text-xs text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
);
CardContent.displayName = "Card_Core_Content_Node";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-4 sm:p-5 border-t border-border/10 select-none shadow-none tracking-normal font-bold text-xs text-foreground/80 leading-none shrink-0 uppercase w-full flex items-center justify-end gap-2.5 sm:gap-2",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "Card_Core_Footer_Node";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
