import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Interactive Action Trigger Nodes (Button)
 * Hardened action control terminal enforcing kinetic scale feedback, uniform stroke depths, and semantic color balance.
 * Version: Launch Candidate Â· Phase Z0 Geometric Balance Lock
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wider select-none antialiased transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 transform-gpu cursor-pointer active:scale-[0.995] selection:bg-transparent tracking-wide shrink-0",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "border border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border/60 bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border/100",
        secondary: "border border-border/40 bg-muted/40 text-muted-foreground/80 hover:bg-muted hover:text-foreground",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground/80 hover:text-foreground hover:bg-accent",
        link: "border border-transparent bg-transparent text-primary hover:underline underline-offset-4 normal-case font-bold p-0 h-auto tracking-normal",
        glass: "border border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 shadow-sm",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 rounded-lg text-[9px]",
        lg: "h-11 px-6 rounded-xl text-xs",
        xl: "h-12 px-8 rounded-xl text-xs tracking-widest",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const TargetComponentCompositionNode = asChild ? Slot : "button";
    return (
      <TargetComponentCompositionNode
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button_Core_Interaction_Node";

export { Button, buttonVariants };

