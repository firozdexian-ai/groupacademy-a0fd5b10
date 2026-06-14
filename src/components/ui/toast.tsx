import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Protocol Signal Suite (Toast)
 * Hardened WAI-ARIA compliant system signal emitter protecting stacked alert overlays from text truncation jumps.
 * Version: Launch Candidate Â· Phase Z0 Lifecycle & Stack Bounds Locked
 */

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[380px] gap-3 select-none pointer-events-none transform-gpu",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "Toast_Core_Viewport_Node";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-xl border p-4 shadow-md text-left leading-none transform-gpu antialiased select-none sm:select-text",
  {
    variants: {
      variant: {
        default: "bg-popover/95 border-border/60 text-popover-foreground backdrop-blur-md",
        destructive:
          "destructive group border-destructive/30 bg-destructive/[0.02] text-foreground backdrop-blur-md shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
});
Toast.displayName = "Toast_Core_Root_Node";

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background/50 px-3 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-accent focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none cursor-pointer group-[.destructive]:border-destructive/20 group-[.destructive]:text-destructive group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground transition-colors duration-150 transform-gpu active:scale-[0.985] pt-0.5",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = "Toast_Core_Action_Trigger_Node";

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2.5 top-2.5 h-6 w-6 rounded-md bg-muted/20 border border-border/5 text-muted-foreground/40 hover:text-foreground flex items-center justify-center cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring group-[.destructive]:hover:text-destructive shrink-0",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5 stroke-[2.5]" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = "Toast_Core_Close_Trigger_Node";

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide block leading-none pt-0.5 pr-4",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = "Toast_Core_Title_Node";

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-[11px] font-mono font-medium leading-normal text-muted-foreground/60 block pt-1 select-text selection:bg-primary/10 text-wrap pr-4",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = "Toast_Core_Description_Node";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

