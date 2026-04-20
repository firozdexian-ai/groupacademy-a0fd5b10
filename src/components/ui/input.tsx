import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Data Acquisition Node
 * High-precision input field optimized for technical data entry and registry queries.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-border/40 bg-background/50 px-4 py-2 text-sm font-medium tracking-tight ring-offset-background transition-all duration-300",
          "file:border-0 file:bg-transparent file:text-[10px] file:font-black file:uppercase file:tracking-widest file:text-primary",
          "placeholder:text-muted-foreground/50 placeholder:italic",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary/50",
          "disabled:cursor-not-allowed disabled:opacity-30 disabled:bg-muted/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
