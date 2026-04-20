import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Narrative Input Protocol
 * High-fidelity composition node for qualitative data entry and structural feedback.
 * Synchronized with the 2026 'Executive Logic' depth and geometry tokens.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Executive Logic Geometry
        "flex min-h-[120px] w-full rounded-2xl border-2 border-border/40 bg-background/50 px-4 py-4 transition-all duration-300",
        // Typography & Persona
        "text-sm font-medium leading-relaxed placeholder:text-muted-foreground/40 selection:bg-primary/10",
        // Kinetic Handshake (Focus States)
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary/50",
        // Operational Constraints
        "disabled:cursor-not-allowed disabled:opacity-30 disabled:bg-muted/10 resize-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
