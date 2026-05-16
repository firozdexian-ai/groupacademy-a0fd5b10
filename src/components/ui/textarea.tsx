import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * GroUp Academy: Authoritative Narrative Input Protocol Node (Textarea)
 * Hardened multiline input block preventing Cumulative Layout Shift (CLS) and ensuring seamless global token symmetry.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs sm:text-sm font-bold text-foreground/90 transition-colors duration-150 transform-gpu antialiased select-text placeholder:text-muted-foreground/40 placeholder:font-normal shadow-inner outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none shrink-0 leading-relaxed resize-y",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea_Core_Narrative_Node";

export { Textarea };
